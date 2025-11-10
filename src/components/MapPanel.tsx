import { useEffect, useRef, useState, memo } from 'react';
import type { Poi, CreatePoiDto } from '../hooks/usePoiSocket';
import {
  Map as KakaoMap,
  MapMarker,
  CustomOverlayMap,
  Polyline,
} from 'react-kakao-maps-sdk';

export interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
}

export interface DayLayer {
  id: string;
  label: string;
  color: string;
}

interface MapPanelProps {
  itinerary: Record<string, Poi[]>;
  dayLayers: DayLayer[];
  pois: Poi[];
  isSyncing: boolean;
  markPoi: (
    poiData: Omit<CreatePoiDto, 'workspaceId' | 'createdBy' | 'id'>
  ) => void;
  unmarkPoi: (poiId: string | number) => void;
  selectedPlace: KakaoPlace | null;
  mapRef: React.RefObject<kakao.maps.Map>;
  onPoiDragEnd: (poiId: string, lat: number, lng: number) => void;
  setSelectedPlace: (place: KakaoPlace | null) => void;
}

interface PoiMarkerProps {
  poi: Poi;
  onPoiDragEnd: (poiId: string, lat: number, lng: number) => void;
  sequenceNumber?: number; // 순번을 위한 prop 추가
  markerColor?: string; // 마커 색상을 위한 prop 추가
}

const PoiMarker = memo(
  ({ poi, onPoiDragEnd, sequenceNumber, markerColor }: PoiMarkerProps) => {
    const [isInfoWindowOpen, setIsInfoWindowOpen] = useState(false);
    const infoWindowTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 순번이 없는 마커에만 인포윈도우 로직을 활성화
    const enableInfoWindowOnHover = sequenceNumber === undefined;

    const handleMouseOver = () => {
      if (enableInfoWindowOnHover) {
        if (infoWindowTimeoutRef.current) {
          clearTimeout(infoWindowTimeoutRef.current);
          infoWindowTimeoutRef.current = null;
        }
        setIsInfoWindowOpen(true);
      }
    };

    const handleMouseOut = () => {
      if (enableInfoWindowOnHover) {
        infoWindowTimeoutRef.current = setTimeout(() => {
          setIsInfoWindowOpen(false);
        }, 100); // 100ms 지연
      }
    };

    const handleClick = () => {
      if (enableInfoWindowOnHover) {
        if (infoWindowTimeoutRef.current) {
          clearTimeout(infoWindowTimeoutRef.current);
          infoWindowTimeoutRef.current = null;
        }
        setIsInfoWindowOpen(true);
      }
    };

    return (
      <MapMarker
        position={{ lat: poi.latitude, lng: poi.longitude }}
        draggable={true}
        // 순번이 있는 마커는 클릭 불가능하게 설정하여 기본 정보창 방지
        clickable={!sequenceNumber}
        // 순번이 없는 마커에만 마우스 이벤트 핸들러를 할당
        onMouseOver={enableInfoWindowOnHover ? handleMouseOver : undefined}
        onMouseOut={enableInfoWindowOnHover ? handleMouseOut : undefined}
        onClick={enableInfoWindowOnHover ? handleClick : undefined}
        onDragEnd={(marker) => {
          const newPosition = marker.getPosition();
          onPoiDragEnd(poi.id, newPosition.getLat(), newPosition.getLng());
        }}
      >
        {sequenceNumber !== undefined && (
          <CustomOverlayMap
            position={{ lat: poi.latitude, lng: poi.longitude }}
            xAnchor={0.5} // 마커 이미지의 중앙에 위치하도록 조정
            yAnchor={1.7} // 마커 이미지 위로 적절히 띄우기 (transform 제거 보정)
            zIndex={2}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                backgroundColor: markerColor || '#FF5733', // 전달받은 색상 사용, 폴백 색상
                color: '#fff',
                borderRadius: '50%',
                fontWeight: 'bold',
                fontSize: '14px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                // transform: 'translate(-50%, -50%)', // xAnchor와 yAnchor로 위치 조정하므로 제거
              }}
            >
              {sequenceNumber}
            </div>
          </CustomOverlayMap>
        )}
        {enableInfoWindowOnHover &&
          isInfoWindowOpen && ( // 순번이 없는 마커에만 인포윈도우 표시
            <CustomOverlayMap
              position={{ lat: poi.latitude, lng: poi.longitude }}
              xAnchor={0.5}
              yAnchor={1.5}
              zIndex={1}
            >
              <div
                onMouseOver={handleMouseOver}
                onMouseOut={handleMouseOut}
                style={{
                  padding: '10px',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                  minWidth: '180px',
                  maxWidth: '400px',
                  whiteSpace: 'normal',
                  lineHeight: '1.5',
                  textAlign: 'left',
                  boxSizing: 'border-box',
                  display: 'block',
                }}
              >
                <div
                  style={{
                    fontWeight: 'bold',
                    fontSize: '16px',
                    marginBottom: '5px',
                    color: '#333',
                    textAlign: 'center',
                  }}
                >
                  {poi.placeName}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#666',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {poi.address}
                </div>
              </div>
            </CustomOverlayMap>
          )}
      </MapMarker>
    );
  }
);

export function MapPanel({
  itinerary,
  dayLayers,
  pois,
  isSyncing,
  markPoi,
  unmarkPoi,
  selectedPlace,
  mapRef,
  onPoiDragEnd,
  setSelectedPlace,
}: MapPanelProps) {
  const [mapInstance, setMapInstance] = useState<kakao.maps.Map | null>(null);
  const pendingSelectedPlaceRef = useRef<KakaoPlace | null>(null);

  useEffect(() => {
    if (selectedPlace && mapInstance) {
      const position = new window.kakao.maps.LatLng(
        Number(selectedPlace.y),
        Number(selectedPlace.x)
      );
      mapInstance.panTo(position);

      const poiData = {
        latitude: Number(selectedPlace.y),
        longitude: Number(selectedPlace.x),
        address: selectedPlace.road_address_name || selectedPlace.address_name,
        placeName: selectedPlace.place_name,
        categoryName: selectedPlace.category_name,
      };
      markPoi(poiData);
      setSelectedPlace(null);
    } else if (selectedPlace && !mapInstance) {
      pendingSelectedPlaceRef.current = selectedPlace;
    }
  }, [selectedPlace, mapInstance, markPoi, setSelectedPlace]);

  useEffect(() => {
    if (mapInstance && pendingSelectedPlaceRef.current) {
      const placeToProcess = pendingSelectedPlaceRef.current;
      pendingSelectedPlaceRef.current = null;

      const position = new window.kakao.maps.LatLng(
        Number(placeToProcess.y),
        Number(placeToProcess.x)
      );
      mapInstance.panTo(position);

      const poiData = {
        latitude: Number(placeToProcess.y),
        longitude: Number(placeToProcess.x),
        address:
          placeToProcess.road_address_name || placeToProcess.address_name,
        placeName: placeToProcess.place_name,
        categoryName: placeToProcess.category_name,
      };
      markPoi(poiData);
      setSelectedPlace(null);
    }
  }, [mapInstance, markPoi, setSelectedPlace]);

  // itinerary에 있는 poi들에 순번과 색상을 매겨주는 객체 생성
  const scheduledPoiData = new Map<
    string,
    { sequence: number; color: string }
  >();
  dayLayers.forEach((dayLayer) => {
    const dayPois = itinerary[dayLayer.id];
    if (dayPois) {
      dayPois.forEach((poi, index) => {
        scheduledPoiData.set(poi.id, {
          sequence: index + 1,
          color: dayLayer.color,
        });
      });
    }
  });

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* 카카오맵 API가 생성하는 기본 정보창으로 추정되는 요소를 숨깁니다. */}
      {/* 제공해주신 HTML 스니펫의 고유한 스타일 속성들을 조합하여 선택자를 만듭니다. */}
      <style>
        {`
          div[style*="background: rgb(255, 255, 255);"][style*="border: 1px solid rgb(118, 129, 168);"] {
            display: none !important;
          }
        `}
      </style>
      <KakaoMap
        center={{ lat: 33.450701, lng: 126.570667 }}
        style={{ width: '100%', height: '100%' }}
        level={3}
        onCreate={(map) => {
          if (mapRef) {
            (mapRef as React.MutableRefObject<kakao.maps.Map>).current = map;
            setMapInstance(map);
          }
        }}
        onClick={(_map, mouseEvent) => {
          const latlng = mouseEvent.latLng;
          const geocoder = new window.kakao.maps.services.Geocoder();
          const places = new window.kakao.maps.services.Places();

          geocoder.coord2Address(
            latlng.getLng(),
            latlng.getLat(),
            (result, status) => {
              if (status === window.kakao.maps.services.Status.OK) {
                const address =
                  result[0].road_address?.address_name ||
                  result[0].address.address_name;

                places.keywordSearch(
                  address,
                  (data, searchStatus) => {
                    let placeName = address;
                    let categoryName: string | undefined = undefined;

                    if (
                      searchStatus === window.kakao.maps.services.Status.OK &&
                      data.length > 0
                    ) {
                      const place = data[0];
                      placeName = place.place_name;
                      categoryName = place.category_name;
                    }

                    const poiData = {
                      latitude: latlng.getLat(),
                      longitude: latlng.getLng(),
                      address: address,
                      categoryName: categoryName,
                      placeName: placeName,
                    };
                    markPoi(poiData);
                  },
                  {
                    location: latlng,
                    radius: 50,
                    sort: window.kakao.maps.services.SortBy?.DISTANCE,
                  }
                );
              }
            }
          );
        }}
      >
        {pois.map((poi) => {
          const data = scheduledPoiData.get(poi.id);
          const sequenceNumber = data?.sequence;
          const markerColor = data?.color;
          return (
            <PoiMarker
              key={poi.id}
              poi={poi}
              onPoiDragEnd={onPoiDragEnd}
              sequenceNumber={sequenceNumber} // 계산된 순번 전달
              markerColor={markerColor} // 계산된 색상 전달
            />
          );
        })}

        {dayLayers.map((layer) => {
          const path = (itinerary[layer.id] || []).map((poi) => ({
            lat: poi.latitude,
            lng: poi.longitude,
          }));

          return path.length > 1 ? (
            <Polyline
              key={layer.id}
              path={path}
              strokeWeight={3}
              strokeColor={layer.color}
              strokeOpacity={0.8}
              strokeStyle={'solid'}
            />
          ) : null;
        })}
      </KakaoMap>

      {isSyncing && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'white',
            padding: '10px',
            borderRadius: '5px',
            zIndex: 2,
          }}
        >
          데이터 동기화 중...
        </div>
      )}
    </div>
  );
}
