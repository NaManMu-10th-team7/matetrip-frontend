import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import {
  Plus,
  Maximize2,
  Layers,
  Loader2,
} from 'lucide-react';
import { Button } from './ui/button'; // prettier-ignore
import {
  Map as KakaoMap,
  MapMarker,
  Polyline,
  CustomOverlayMap,
} from 'react-kakao-maps-sdk'; // prettier-ignore
import {
  type Poi,
  type PoiConnection,
  type CreatePoiConnectionDto,
} from '../hooks/usePoiSocket';
import { KAKAO_REST_API_KEY } from '../constants';
import { useDirections } from '../hooks/useDirections';

export type DayLayer = {
  id: string; // UUID
  label: string;
  color: string;
};

// 카카오 장소 검색 결과 타입을 정의합니다.
export type KakaoPlace = kakao.maps.services.PlacesSearchResultItem;

const KAKAO_MAP_SERVICES_STATUS = window.kakao?.maps.services.Status;

// MapUI 컴포넌트가 selectedLayer 상태와 상태 변경 함수를 props로 받도록 수정
function MapUI({
  selectedLayer,
  setSelectedLayer,
  UILayers,
}: {
  // 2. MapUI 컴포넌트의 props 타입도 동적으로 변경된 타입에 맞게 수정합니다.
  selectedLayer: 'all' | string;
  setSelectedLayer: React.Dispatch<React.SetStateAction<'all' | string>>;
  UILayers: { id: 'all' | DayLayer['id']; label: string }[];
}) {
  return (
    <>
      {/* Layer Controls */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 space-y-2 w-32">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-gray-600" />
          <span className="text-sm">레이어</span>
        </div>
        {UILayers.map((layer) => (
          <button
            key={layer.id}
            onClick={() => setSelectedLayer(layer.id)}
            className={`w-full px-3 py-2 rounded text-sm transition-colors ${
              selectedLayer === layer.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {layer.label}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          여행지 추가
        </Button>
        <Button size="sm" variant="outline" className="gap-2 bg-white">
          <Maximize2 className="w-4 h-4" />
          전체 화면
        </Button>
      </div>
    </>
  );
}

export function MapPanel({
  itinerary,
  setItinerary,
  dayLayers,
  pois,
  isSyncing,
  markPoi,
  unmarkPoi,
  connectPoi,
  selectedPlace,
  connections,
  onPoiClick,
  mapRef
}: {
  itinerary: Record<string, Poi[]>;
  setItinerary: React.Dispatch<React.SetStateAction<Record<string, Poi[]>>>;
  dayLayers: DayLayer[];
  pois: Poi[];
  isSyncing: boolean;
  markPoi: (
    poiData: Omit<CreatePoiDto, 'workspaceId' | 'createdBy' | 'id'>
  ) => void;
  unmarkPoi: (poiId: string | number) => void;
  connectPoi: (
    connectionData: Omit<CreatePoiConnectionDto, 'workspaceId'>
  ) => void;
  selectedPlace: KakaoPlace | null;
  connections: Record<string, PoiConnection[]>;
  onPoiClick: (poi: Poi) => void;
  mapRef: React.RefObject<kakao.maps.Map>;
}) {
  // '전체' 레이어를 포함한 전체 UI용 레이어 목록
  const UILayers: { id: 'all' | DayLayer['id']; label: string }[] = [
    { id: 'all', label: '전체' },
    ...dayLayers,
  ];

  const [selectedLayer, setSelectedLayer] = useState<'all' | string>('all');

  React.useEffect(() => {
    const newItinerary: Record<string, Poi[]> = dayLayers.reduce(
      (acc, layer) => ({ ...acc, [layer.id]: [] }),
      {}
    );

    if (!pois || pois.length === 0 || !connections) {
      setItinerary(newItinerary);
      return;
    }

    const poiMap = new Map(pois.map((p) => [p.id, p]));

    for (const dayId in connections) {
      if (!newItinerary[dayId]) {
        continue;
      }

      const dayConnections = connections[dayId] || [];
      if (dayConnections.length === 0) continue;

      const allNextPoiIds = new Set(dayConnections.map((c) => c.nextPoiId));
      const allPrevPoiIds = new Set(dayConnections.map((c) => c.prevPoiId));

      const startNodeIds = [...allPrevPoiIds].filter(
        (id) => !allNextPoiIds.has(id)
      );

      const visited = new Set();

      for (const startId of startNodeIds) {
        let currentPoiId: string | number | undefined = startId;
        while (currentPoiId && !visited.has(currentPoiId)) {
          visited.add(currentPoiId);
          const nextConnection = dayConnections.find(
            (c) => c.prevPoiId === currentPoiId
          );
          const poi = poiMap.get(currentPoiId);

          if (poi) {
            const inboundConnection = dayConnections.find(
              (c) => c.nextPoiId === currentPoiId
            );
            newItinerary[dayId].push({
              ...poi,
              distance: inboundConnection?.distance,
              duration: inboundConnection?.duration,
            });
          }
          currentPoiId = nextConnection?.nextPoiId;
        }
      }
    }
    setItinerary(newItinerary);
  }, [pois, connections, dayLayers, setItinerary]);

  const { routePaths } = useDirections(itinerary);

  const addToItinerary = async (markerToAdd: Poi) => {
    if (!KAKAO_REST_API_KEY) {
      console.error('Kakao REST API Key가 설정되지 않았습니다.');
      alert('경로 계산 기능을 사용할 수 없습니다. API 키를 확인해주세요.');
      return;
    }

    const isAlreadyAdded = Object.values(itinerary)
      .flat()
      .some((item) => item.id === markerToAdd.id);

    if (isAlreadyAdded) {
      alert('이미 일정에 추가된 장소입니다.');
      return;
    }

    const targetDayId = markerToAdd.planDayId;
    if (!targetDayId) {
      alert('이 장소는 특정 날짜에 속해있지 않아 일정에 추가할 수 없습니다.');
      return;
    }

    const currentDayItinerary = itinerary[targetDayId] || [];
    const lastPoiInDay = currentDayItinerary[currentDayItinerary.length - 1];

    if (lastPoiInDay) {
      let distance: number | undefined;
      let duration: number | undefined;

      try {
        const response = await axios.get(
          'https://apis-navi.kakaomobility.com/v1/directions',
          {
            headers: {
              Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
              'Content-Type': 'application/json',
            },
            params: {
              origin: `${lastPoiInDay.longitude},${lastPoiInDay.latitude}`,
              destination: `${markerToAdd.longitude},${markerToAdd.latitude}`,
            },
          }
        );

        const route = response.data.routes[0];
        if (route) {
          distance = route.summary.distance;
          duration = route.summary.duration;
        }
      } catch (error) {
        console.error('경로 거리/시간 계산 중 오류 발생:', error);
      }

      connectPoi({
        prevPoiId: lastPoiInDay.id,
        nextPoiId: markerToAdd.id,
        planDayId: targetDayId,
        distance,
        duration,
      });
    }

    const newItineraryForDay = [...(itinerary[targetDayId] || []), markerToAdd];
    setItinerary({ ...itinerary, [targetDayId]: newItineraryForDay });
  };

  const markersToDisplay =
    selectedLayer === 'all'
      ? pois || []
      : (pois || []).filter((p) => p.planDayId === selectedLayer);

  const [openInfoWindow, setOpenInfoWindow] = useState<string | number | null>(
    null
  );

  useEffect(() => {
    if (selectedPlace && mapRef.current) {
      const moveLatLon = new window.kakao.maps.LatLng(
        Number(selectedPlace.y),
        Number(selectedPlace.x)
      );
      mapRef.current.panTo(moveLatLon);
    }
  }, [selectedPlace, mapRef]);

  return (
    <div className="h-full relative">
      {isSyncing && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="mt-4 text-lg text-gray-700">
            워크스페이스 데이터를 동기화하는 중입니다...
          </p>
        </div>
      )}

      <KakaoMap
        className="w-full h-full"
        ref={mapRef}
        center={{
          lat: 33.450701,
          lng: 126.570667,
        }}
        level={1}
        onClick={(_t, mouseEvent) => {
          if (
            !window.kakao ||
            !window.kakao.maps ||
            !window.kakao.maps.services
          ) {
            alert('Kakao Maps services 라이브러리가 로드되지 않았습니다.');
            return;
          }

          const latlng = mouseEvent.latLng;
          const geocoder = new window.kakao.maps.services.Geocoder();

          geocoder.coord2Address(
            latlng.getLng(),
            latlng.getLat(),
            (result, status) => {
              if (
                !KAKAO_MAP_SERVICES_STATUS ||
                status !== KAKAO_MAP_SERVICES_STATUS.OK
              ) {
                console.error(
                  'Geocoder가 주소를 가져오는 데 실패했습니다. 상태:',
                  status
                );
                return;
              }

              const addressResult = result[0];
              const address =
                addressResult?.road_address?.address_name ||
                addressResult?.address?.address_name;
              const searchKeyword =
                addressResult?.road_address?.building_name || address;

              const places = new window.kakao.maps.services.Places();
              places.keywordSearch(
                searchKeyword,
                (data, status) => {
                  let placeName = searchKeyword;
                  let categoryName: string | undefined = undefined;

                  if (
                    KAKAO_MAP_SERVICES_STATUS &&
                    status === KAKAO_MAP_SERVICES_STATUS.OK
                  ) {
                    const place = data[0];
                    placeName = place.place_name;
                    categoryName = place.category_name;
                  }

                  markPoi({
                    planDayId: selectedLayer === 'all' ? undefined : selectedLayer,
                    latitude: latlng.getLat(),
                    longitude: latlng.getLng(),
                    address: address,
                    categoryName: categoryName,
                    placeName: placeName,
                  });
                },
                {
                  location: latlng,
                  radius: 50,
                  sort: window.kakao.maps.services.SortBy?.DISTANCE,
                }
              );
            }
          );
        }}
      >
        {markersToDisplay.map((marker) => (
          <MapMarker
            key={`marker-${marker.id}`}
            position={{ lat: marker.latitude, lng: marker.longitude }}
            onMouseOver={() => setOpenInfoWindow(marker.id)}
            onMouseOut={() => setOpenInfoWindow(null)}
          >
            {openInfoWindow === marker.id && (
              <CustomOverlayMap
                position={{ lat: marker.latitude, lng: marker.longitude }}
                yAnchor={1.2}
                zIndex={2}
                clickable={true}
              >
                <div
                  className="bg-white rounded-lg border border-gray-300 shadow-md min-w-[200px] text-black overflow-hidden"
                  onMouseOver={() => setOpenInfoWindow(marker.id)}
                  onMouseOut={() => setOpenInfoWindow(null)}
                >
                  <div className="p-3">
                    <div className="font-bold text-sm mb-1">
                      {marker.placeName}
                    </div>
                    {marker.categoryName && (
                      <div className="text-xs text-gray-500 mb-1">
                        {
                          marker.categoryName.split(' > ').pop()
                        }
                      </div>
                    )}
                    <div className="text-xs text-gray-600 mb-3">
                      {marker.address}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className={`flex-1 h-8 text-xs ${
                          Object.values(itinerary)
                            .flat()
                            .some((item) => item.id === marker.id)
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToItinerary(marker);
                        }}
                        disabled={Object.values(itinerary)
                          .flat()
                          .some((item) => item.id === marker.id)}
                      >
                        {Object.values(itinerary)
                          .flat()
                          .some((item) => item.id === marker.id)
                          ? '추가됨'
                          : '일정에 추가'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 h-8 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          unmarkPoi(marker.id);
                        }}
                      >
                        마커 삭제
                      </Button>
                    </div>
                  </div>
                </div>
              </CustomOverlayMap>
            )}
          </MapMarker>
        ))}

        {Object.entries(itinerary).map(([layerId, dayItinerary]) => {
          const shouldDisplay =
            selectedLayer === 'all' || selectedLayer === layerId;
          return (
            shouldDisplay &&
            dayItinerary.map((marker, index) => (
              <CustomOverlayMap
                key={`order-overlay-${marker.id}`}
                position={{ lat: marker.latitude, lng: marker.longitude }}
                yAnchor={2.5}
                zIndex={1}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '1.25rem',
                    height: '1.25rem',
                    backgroundColor: 'black',
                    color: 'white',
                    fontSize: '0.75rem',
                    borderRadius: '9999px',
                    boxShadow:
                      '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                  }}
                >
                  {index + 1}
                </div>
              </CustomOverlayMap>
            ))
          );
        })}

        {dayLayers.map((layer) => {
          const shouldDisplay =
            selectedLayer === 'all' || selectedLayer === layer.id;
          const dayPath = routePaths[layer.id];
          return (
            shouldDisplay &&
            dayPath && (
              <Polyline
                key={layer.id}
                path={dayPath}
                strokeWeight={4}
                strokeColor={layer.color}
                strokeOpacity={0.8}
                strokeStyle={'solid'}
              />
            )
          );
        })}

        <MapUI
          selectedLayer={selectedLayer}
          setSelectedLayer={setSelectedLayer}
          UILayers={UILayers}
        />
      </KakaoMap>
    </div>
  );
}
