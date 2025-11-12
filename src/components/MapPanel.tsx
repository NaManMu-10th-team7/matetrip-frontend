import React, { useEffect, useRef, useState, memo } from 'react';
import type { Poi, CreatePoiDto } from '../hooks/usePoiSocket';
import {
  Map as KakaoMap,
  MapMarker,
  CustomOverlayMap,
  Polyline,
} from 'react-kakao-maps-sdk';
import { KAKAO_REST_API_KEY } from '../constants'; // KAKAO_REST_API_KEY import 추가

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

export interface RouteSegment {
  fromPoiId: string;
  toPoiId: string;
  duration: number; // seconds
  distance: number; // meters
  path: { lat: number; lng: number }[];
}

interface MapPanelProps {
  itinerary: Record<string, Poi[]>;
  dayLayers: DayLayer[];
  pois: Poi[];
  isSyncing: boolean;
  markPoi: (
    poiData: Omit<CreatePoiDto, 'workspaceId' | 'createdBy' | 'id'>
  ) => void;
  selectedPlace: KakaoPlace | null;
  mapRef: React.RefObject<kakao.maps.Map | null>;
  hoveredPoi: Poi | null;
  unmarkPoi: (poiId: string) => void;
  onPoiDragEnd: (poiId: string, lat: number, lng: number) => void;
  setSelectedPlace: (place: KakaoPlace | null) => void;
  onRouteInfoUpdate?: (routeInfo: Record<string, RouteSegment[]>) => void; // 추가된 prop
}

interface PoiMarkerProps {
  poi: Poi;
  onPoiDragEnd: (poiId: string, lat: number, lng: number) => void;
  sequenceNumber?: number;
  markerColor?: string;
  isHovered: boolean;
}

const PoiMarker = memo(
  ({
    poi,
    onPoiDragEnd,
    sequenceNumber,
    markerColor,
    isHovered,
  }: PoiMarkerProps) => {
    const [isInfoWindowOpen, setIsInfoWindowOpen] = useState(false);
    const infoWindowTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseOver = () => {
      if (infoWindowTimeoutRef.current) {
        clearTimeout(infoWindowTimeoutRef.current);
        infoWindowTimeoutRef.current = null;
      }
      setIsInfoWindowOpen(true);
    };

    const handleMouseOut = () => {
      infoWindowTimeoutRef.current = setTimeout(() => {
        setIsInfoWindowOpen(false);
      }, 100);
    };

    const handleClick = () => {
      if (infoWindowTimeoutRef.current) {
        clearTimeout(infoWindowTimeoutRef.current);
        infoWindowTimeoutRef.current = null;
      }
      setIsInfoWindowOpen(true);
    };

    useEffect(() => {
      setIsInfoWindowOpen(isHovered);
    }, [isHovered]);

    return (
      <MapMarker
        position={{ lat: poi.latitude, lng: poi.longitude }}
        draggable={true}
        clickable={true}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        onClick={handleClick}
        onDragEnd={(marker) => {
          const newPosition = marker.getPosition();
          onPoiDragEnd(poi.id, newPosition.getLat(), newPosition.getLng());
        }}
      >
        {sequenceNumber !== undefined && (
          <CustomOverlayMap
            position={{ lat: poi.latitude, lng: poi.longitude }}
            xAnchor={0.5}
            yAnchor={2.2}
            zIndex={2}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                backgroundColor: markerColor || '#FF5733',
                color: '#fff',
                borderRadius: '50%',
                fontWeight: 'bold',
                fontSize: '14px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              {sequenceNumber}
            </div>
          </CustomOverlayMap>
        )}
        {isInfoWindowOpen && (
          <CustomOverlayMap
            position={{ lat: poi.latitude, lng: poi.longitude }}
            xAnchor={0.5}
            yAnchor={1.5}
            zIndex={3}
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
  selectedPlace,
  mapRef,
  hoveredPoi,
  onPoiDragEnd,
  setSelectedPlace,
  onRouteInfoUpdate, // 추가된 prop
}: MapPanelProps) {
  const [mapInstance, setMapInstance] = useState<kakao.maps.Map | null>(null);
  const pendingSelectedPlaceRef = useRef<KakaoPlace | null>(null);
  // 일자별 경로 세그먼트 정보를 저장할 상태 추가
  const [dailyRouteInfo, setDailyRouteInfo] = useState<
    Record<string, RouteSegment[]>
  >({});

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

  // Kakao 길찾기 API 호출 및 경로 정보 업데이트 useEffect 추가
  useEffect(() => {
    console.log('useEffect for fetching daily routes triggered.');
    console.log('Current itinerary:', itinerary);
    console.log('Current dayLayers:', dayLayers);

    const fetchDailyRoutes = async () => {
      const newDailyRouteInfo: Record<string, RouteSegment[]> = {};

      for (const dayLayer of dayLayers) {
        const dayPois = itinerary[dayLayer.id];
        if (dayPois && dayPois.length >= 2) {
          const origin = `${dayPois[0].longitude},${dayPois[0].latitude}`;
          const destination = `${dayPois[dayPois.length - 1].longitude},${
            dayPois[dayPois.length - 1].latitude
          }`;
          // 경유지는 두 번째 POI부터 마지막 POI 직전까지
          const waypoints = dayPois
            .slice(1, dayPois.length - 1)
            .map((poi) => `${poi.longitude},${poi.latitude}`)
            .join('|');

          console.log(`Fetching route for day ${dayLayer.id}:`);
          console.log(`  Origin: ${origin}`);
          console.log(`  Destination: ${destination}`);
          console.log(`  Waypoints: ${waypoints || 'None'}`);

          try {
            const response = await fetch(
              `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin}&destination=${destination}${
                waypoints ? `&waypoints=${waypoints}` : ''
              }`,
              {
                method: 'GET',
                headers: {
                  Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
                },
              }
            );

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(
                `HTTP error! status: ${response.status}, message: ${errorText}`
              );
            }

            const data = await response.json();
            console.log(`API response for day ${dayLayer.id}:`, data);

            // 경로 정보가 있고, 그 안에 sections 배열이 있는지 확인
            if (data.routes && data.routes.length > 0 && data.routes[0].sections) {
              const route = data.routes[0];
              const segments: RouteSegment[] = [];

              // Kakao API 응답의 sections 배열을 순회하며 각 세그먼트 정보 추출
              if (route.sections) { // 이중 확인으로 안정성 강화
                route.sections.forEach((section: any, index: number) => {
                  const detailedPath: { lat: number; lng: number }[] = [];
                  section.roads.forEach((road: any) => {
                    for (let i = 0; i < road.vertexes.length; i += 2) {
                      detailedPath.push({
                        lng: road.vertexes[i],
                        lat: road.vertexes[i + 1],
                      });
                    }
                  });

                  // 이 섹션이 연결하는 POI를 식별
                  const fromPoi = dayPois[index];
                  const toPoi = dayPois[index + 1];

                  if (fromPoi && toPoi) {
                    segments.push({
                      fromPoiId: fromPoi.id,
                      toPoiId: toPoi.id,
                      duration: section.duration,
                      distance: section.distance,
                      path: detailedPath,
                    });
                  }
                });
                newDailyRouteInfo[dayLayer.id] = segments;
              }
            } else {
              console.warn(
                `No routes found for day ${dayLayer.id} with data:`,
                data
              );
            }
          } catch (error) {
            console.error(
              `Error fetching directions for day ${dayLayer.id}:`,
              error
            );
          }
        } else {
          console.log(
            `Skipping route fetch for day ${dayLayer.id}: not enough POIs (${
              dayPois ? dayPois.length : 0
            })`
          );
        }
      }

      console.log('New daily route info before setting state:', newDailyRouteInfo);
      setDailyRouteInfo(newDailyRouteInfo);
      // 경로 정보 업데이트 시 부모 컴포넌트로 전달
      if (onRouteInfoUpdate) {
        onRouteInfoUpdate(newDailyRouteInfo);
      }
    };

    fetchDailyRoutes();
  }, [itinerary, dayLayers, onRouteInfoUpdate]); // onRouteInfoUpdate를 의존성 배열에 추가

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
              sequenceNumber={sequenceNumber}
              markerColor={markerColor}
              isHovered={hoveredPoi?.id === poi.id}
            />
          );
        })}

        {/* 각 세그먼트별 Polyline 렌더링 */}
        {dayLayers.map((layer) => {
          const segments = dailyRouteInfo[layer.id];
          if (segments && segments.length > 0) {
            return segments.map((segment, index) => (
              <Polyline
                key={`${layer.id}-segment-${index}`} // 각 세그먼트별 고유 키
                path={segment.path}
                strokeWeight={3}
                strokeColor={layer.color}
                strokeOpacity={0.8}
                strokeStyle={'solid'}
              />
            ));
          }
          // 상세 경로 정보가 없으면 기존처럼 POI를 직접 연결
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

        {/* 각 세그먼트별 경로 정보 표시 CustomOverlayMap 추가 */}
        {dayLayers.map((layer) => {
          const segments = dailyRouteInfo[layer.id];

          if (segments && segments.length > 0) {
            return segments.map((segment, index) => {
              // 세그먼트의 상세 경로가 없거나 길이가 0이면 오버레이를 표시하지 않음
              if (!segment.path || segment.path.length === 0) return null;

              // 경로의 중간 지점 계산
              const midPointIndex = Math.floor(segment.path.length / 2);
              const midPoint = segment.path[midPointIndex];

              const totalMinutes = Math.ceil(segment.duration / 60); // 초를 분으로 변환 (올림)
              const totalKilometers = (segment.distance / 1000).toFixed(1); // 미터를 킬로미터로 변환 (소수점 첫째 자리)

              return (
                <CustomOverlayMap
                  key={`route-info-${layer.id}-${index}`}
                  position={{ lat: midPoint.lat, lng: midPoint.lng }} // 중간 지점 사용
                  yAnchor={1.5} // 경로 위에 표시되도록 조정
                >
                  <div
                    style={{
                      padding: '5px 10px',
                      backgroundColor: 'white',
                      borderRadius: '5px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#333',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {`${totalMinutes}분, ${totalKilometers}km`}
                  </div>
                </CustomOverlayMap>
              );
            });
          }
          return null;
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
