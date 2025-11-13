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
  unmarkPoi: (poiId: string) => void; // usePoiSocket.ts 에서는 string | number 로 되어있지만, Workspace.tsx 에서는 string으로 사용하고 있으므로 string으로 통일
  onPoiDragEnd: (poiId: string, lat: number, lng: number) => void;
  setSelectedPlace: (place: KakaoPlace | null) => void;
  onRouteInfoUpdate?: (routeInfo: Record<string, RouteSegment[]>) => void; // 추가된 prop
  // 경로 최적화를 위한 콜백 추가
  onRouteOptimized?: (dayId: string, optimizedPoiIds: string[]) => void;
  // [추가] 최적화 로직을 트리거하고 완료를 알리기 위한 props
  optimizingDayId?: string | null;
  onOptimizationComplete?: () => void;
}

// 카카오내비 API 응답 타입을 위한 인터페이스 추가
interface KakaoNaviRoad {
  name: string;
  distance: number;
  duration: number;
  traffic_speed: number;
  traffic_state: number;
  vertexes: number[];
}

interface KakaoNaviSection {
  distance: number;
  duration: number;
  roads: KakaoNaviRoad[];
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
  onRouteOptimized,
  optimizingDayId,
  onOptimizationComplete,
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

  // [수정] 경로 그리기 전용 useEffect: itinerary나 dayLayers가 변경될 때만 실행
  useEffect(() => {
    console.log('[Effect] Drawing routes based on itinerary change.');
    const drawStandardRoutes = async () => {
      const newDailyRouteInfo: Record<string, RouteSegment[]> = {};

      for (const dayLayer of dayLayers) {
        const dayPois = itinerary[dayLayer.id];
        if (dayPois && dayPois.length >= 2) {
          try {
            const originPoi = dayPois[0];
            const destinationPoi = dayPois[dayPois.length - 1];
            const waypoints = dayPois.slice(1, dayPois.length - 1);
            const requestBody = {
              origin: {
                x: String(originPoi.longitude),
                y: String(originPoi.latitude),
              },
              destination: {
                x: String(destinationPoi.longitude),
                y: String(destinationPoi.latitude),
              },
              waypoints: waypoints.map((poi) => ({
                name: poi.placeName,
                x: String(poi.longitude),
                y: String(poi.latitude),
              })),
              priority: 'TIME',
              summary: true,
              road_details: true,
            };

            const response = await fetch(
              `https://apis-navi.kakaomobility.com/v1/waypoints/directions`,
              {
                method: 'POST',
                headers: {
                  Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
              }
            );

            if (!response.ok)
              throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();

            if (data.routes && data.routes[0]?.sections) {
              const route = data.routes[0];
              const segments: RouteSegment[] = [];
              const currentPoisInOrder = [
                originPoi,
                ...waypoints,
                destinationPoi,
              ];

              route.sections.forEach((section: KakaoNaviSection, index: number) => {
                const detailedPath: { lat: number; lng: number }[] = [];
                if (section.roads) {
                  section.roads.forEach((road: KakaoNaviRoad) => {
                    for (let i = 0; i < road.vertexes.length; i += 2) {
                      detailedPath.push({
                        lng: road.vertexes[i],
                        lat: road.vertexes[i + 1],
                      });
                    }
                  });
                }

                const fromPoi = currentPoisInOrder[index];
                const toPoi = currentPoisInOrder[index + 1];

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

      console.log(
        'New daily route info before setting state:',
        newDailyRouteInfo
      );
      setDailyRouteInfo(newDailyRouteInfo);
      // 경로 정보 업데이트 시 부모 컴포넌트로 전달
      if (onRouteInfoUpdate) {
        onRouteInfoUpdate(newDailyRouteInfo);
      }
    };

    drawStandardRoutes();
  }, [itinerary, dayLayers, onRouteInfoUpdate]);

  // [추가] 경로 최적화 전용 useEffect: optimizingDayId가 변경될 때만 실행
  useEffect(() => {
    if (!optimizingDayId) return;

    console.log(`[Effect] Optimizing route for day: ${optimizingDayId}`);

    const optimizeRoute = async () => {
      const dayPois = itinerary[optimizingDayId];
      if (!dayPois || dayPois.length < 4) {
        // 출발, 도착, 경유지 2개 이상
        console.warn('[TSP] Not enough POIs to optimize.');
        onOptimizationComplete?.();
        return;
      }

      // 두 지점 간의 경로 정보를 가져오는 함수
      const fetchDuration = async (
        from: Poi,
        to: Poi
      ): Promise<{
        from: string;
        to: string;
        duration: number;
        distance: number;
      } | null> => {
        try {
          // [수정] GET 요청으로 변경하고, 파라미터를 URL 쿼리 스트링으로 전달합니다.
          const response = await fetch(
            `https://apis-navi.kakaomobility.com/v1/directions?origin=${from.longitude},${from.latitude}&destination=${to.longitude},${to.latitude}&priority=TIME&summary=true`,
            {
              method: 'GET',
              headers: {
                Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
              },
            }
          );
          if (!response.ok) return null;
          const data = await response.json();
          if (data.routes && data.routes[0] && data.routes[0].summary) {
            return {
              from: from.id,
              to: to.id,
              duration: data.routes[0].summary.duration,
              distance: data.routes[0].summary.distance,
            };
          }
          return null;
        } catch (error) {
          console.error(
            `Error fetching duration between ${from.placeName} and ${to.placeName}:`,
            error
          );
          return null;
        }
      };

      try {
        const originPoi = dayPois[0];
        const destinationPoi = dayPois[dayPois.length - 1];
        const waypoints = dayPois.slice(1, dayPois.length - 1);
        console.log(
          `[TSP] Starting optimization for day ${optimizingDayId} with ${waypoints.length} waypoints.`
        );
        const allPoints = [originPoi, ...waypoints, destinationPoi];
        const promises: ReturnType<typeof fetchDuration>[] = [];

        // 1. 모든 지점 쌍(pair)에 대한 API 호출 Promise 생성
        for (let i = 0; i < allPoints.length; i++) {
          for (let j = 0; j < allPoints.length; j++) {
            if (i === j) continue;
            promises.push(fetchDuration(allPoints[i], allPoints[j]));
          }
        }

        console.log(`[TSP] Created ${promises.length} API call promises.`);

        // 2. Promise.all로 모든 API를 병렬 호출
        const results = await Promise.all(promises);

        // 3. 결과로 이동 시간 행렬(Matrix) 생성
        const durationMatrix: Record<string, Record<string, number>> = {};
        results.forEach((result) => {
          if (result) {
            if (!durationMatrix[result.from]) durationMatrix[result.from] = {};
            durationMatrix[result.from][result.to] = result.duration;
          }
        });

        console.log('[TSP] Duration Matrix created:', durationMatrix);

        // --- 여기부터는 생성된 durationMatrix를 TSP 솔버에 전달하는 부분 ---
        // 예시: console.log만 하고, 실제 솔버 연동은 서버에서 수행하는 것을 권장합니다.
        // const optimizedOrder = await solveTspOnServer(durationMatrix, originPoi.id, destinationPoi.id);
        // onRouteOptimized?.(optimizingDayId, optimizedOrder);
      } catch (error) {
        console.error(
          `[TSP] Error during optimization for day ${optimizingDayId}:`,
          error
        );
      } finally {
        // 최적화 작업이 성공하든 실패하든 부모에게 완료를 알림
        onOptimizationComplete?.();
      }
    };

    optimizeRoute();
  }, [optimizingDayId, itinerary, onRouteOptimized, onOptimizationComplete]);

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
                strokeWeight={5}
                strokeColor={layer.color}
                strokeOpacity={0.9}
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
              strokeWeight={5}
              strokeColor={layer.color}
              strokeOpacity={0.9}
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
