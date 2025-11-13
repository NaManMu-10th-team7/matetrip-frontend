import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import type { Poi, CreatePoiDto } from '../hooks/usePoiSocket';
import {
  Map as KakaoMap,
  MapMarker,
  CustomOverlayMap,
  Polyline,
} from 'react-kakao-maps-sdk';
import { KAKAO_REST_API_KEY } from '../constants'; // KAKAO_REST_API_KEY import 추가
import { fetchPlacesInBounds } from '../api/places';
import type { PlaceDto } from '../types/place';
import { CATEGORY_INFO } from '../types/place';

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

/**
 * 백엔드 장소 마커 Props
 */
interface PlaceMarkerProps {
  place: PlaceDto;
  onPlaceClick: (place: PlaceDto) => void;
}

/**
 * 백엔드에서 가져온 장소를 표시하는 마커 컴포넌트
 */
const PlaceMarker = memo(({ place, onPlaceClick }: PlaceMarkerProps) => {
  const [isInfoWindowOpen, setIsInfoWindowOpen] = useState(false);
  const infoWindowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (infoWindowTimeoutRef.current) {
        clearTimeout(infoWindowTimeoutRef.current);
      }
    };
  }, []);

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
    onPlaceClick(place);
  };
  // 카테고리에 따른 아이콘 이미지 URL 생성
  const getMarkerImageSrc = (categoryCode: string): string => {
    // 카테고리별 색상 가져오기
    const categoryInfo = CATEGORY_INFO[categoryCode as keyof typeof CATEGORY_INFO];
    const color = categoryInfo?.color || '#808080';

    // 카테고리별로 다른 SVG 아이콘 생성
    let iconSvg = '';

    switch (categoryCode) {
      case '레포츠': // 레포츠 - 자전거/활동 아이콘
        iconSvg = `
          <g transform="translate(16, 16)">
            <!-- 자전거 바퀴 -->
            <circle cx="-4" cy="4" r="3" stroke="white" stroke-width="1.5" fill="none"/>
            <circle cx="4" cy="4" r="3" stroke="white" stroke-width="1.5" fill="none"/>
            <!-- 프레임 -->
            <path d="M-4,4 L0,-2 L4,4 M0,-2 L0,1"
                  stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <!-- 핸들 -->
            <path d="M-1,-2 L1,-2"
                  stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          </g>
        `;
        break;

      case '추천코스': // 추천코스 - 별표 아이콘
        iconSvg = `
          <g transform="translate(16, 16)">
            <!-- 별 -->
            <path d="M0,-6 L1.5,-2 L6,-2 L2.5,1 L4,6 L0,3 L-4,6 L-2.5,1 L-6,-2 L-1.5,-2 Z"
                  fill="white" stroke="white" stroke-width="1"/>
          </g>
        `;
        break;

      case '인문(문화/예술/역사)': // 문화/역사 - 박물관/건물
        iconSvg = `
          <g transform="translate(16, 16)">
            <!-- 지붕 -->
            <path d="M-7,-4 L0,-7 L7,-4 Z" fill="white" stroke="white" stroke-width="1"/>
            <!-- 기둥들 -->
            <rect x="-6" y="-3" width="2" height="8" fill="white"/>
            <rect x="-1" y="-3" width="2" height="8" fill="white"/>
            <rect x="4" y="-3" width="2" height="8" fill="white"/>
            <!-- 바닥 -->
            <rect x="-7" y="5" width="14" height="1" fill="white"/>
          </g>
        `;
        break;

      case '자연': // 자연 - 나무 아이콘
        iconSvg = `
          <g transform="translate(16, 16)">
            <!-- 나무 잎 -->
            <circle cx="0" cy="-3" r="4" fill="white"/>
            <circle cx="-3" cy="-1" r="3" fill="white"/>
            <circle cx="3" cy="-1" r="3" fill="white"/>
            <!-- 나무 줄기 -->
            <rect x="-1" y="1" width="2" height="5" fill="white"/>
          </g>
        `;
        break;

      default:
        // 기본 아이콘 - 위치 핀
        iconSvg = `
          <circle cx="16" cy="16" r="6" fill="white"/>
        `;
    }

    // SVG로 마커 이미지 생성 (데이터 URI 방식)
    const svg = `
      <svg width="36" height="44" xmlns="http://www.w3.org/2000/svg">
        <!-- 핀 모양 배경 -->
        <path d="M18 0C10.8 0 5 5.8 5 13c0 9.9 13 26 13 26s13-16.1 13-26c0-7.2-5.8-13-13-13z"
              fill="${color}" stroke="white" stroke-width="2"/>
        <!-- 카테고리별 아이콘 -->
        ${iconSvg}
      </svg>
    `;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  const markerImageSrc = getMarkerImageSrc(place.category);
  const markerImage = {
    src: markerImageSrc,
    size: { width: 36, height: 44 },
    options: {
      offset: { x: 18, y: 44 }, // 마커 이미지의 기준점
    },
  };

  return (
    <>
      <MapMarker
        position={{ lat: place.latitude, lng: place.longitude }}
        image={markerImage}
        clickable={true}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        onClick={handleClick}
      />
      {isInfoWindowOpen && (
        <CustomOverlayMap
          position={{ lat: place.latitude, lng: place.longitude }}
          xAnchor={0.5}
          yAnchor={1.8}
          zIndex={10}
        >
          <div
            className="min-w-[200px] max-w-[300px] rounded-lg bg-white p-3 shadow-[0_6px_20px_rgba(0,0,0,0.3)]"
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
          >
            <div className="mb-2 text-[16px] font-bold text-[#333]">
              {place.title}
            </div>
            {place.image_url && (
              <img
                src={place.image_url}
                alt={place.title}
                className="mb-2 h-[120px] w-full rounded object-cover"
              />
            )}
            <div className="mb-1 text-[13px] text-[#666]">{place.address}</div>
            {place.summary && (
              <div className="mt-2 text-[12px] leading-snug text-[#888]">
                {place.summary}
              </div>
            )}
            <div className="mt-2 inline-block rounded bg-[#f5f5f5] px-2 py-1 text-[11px] text-[#999]">
              {CATEGORY_INFO[place.category as keyof typeof CATEGORY_INFO]?.name || '기타'}
            </div>
          </div>
        </CustomOverlayMap>
      )}
    </>
  );
});

const PoiMarker = memo(
  ({
    poi,
    onPoiDragEnd,
    sequenceNumber,
    markerColor,
    isHovered,
  }: PoiMarkerProps) => {
    const [isInfoWindowOpen, setIsInfoWindowOpen] = useState(false);
    const infoWindowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
              className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
              style={{ backgroundColor: markerColor || '#FF5733' }}
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
              className="block min-w-[180px] max-w-[400px] whitespace-normal rounded-lg bg-white p-2.5 text-left leading-relaxed shadow-[0_6px_20px_rgba(0,0,0,0.3)]"
              onMouseOver={handleMouseOver}
              onMouseOut={handleMouseOut}
            >
              <div className="mb-1 text-center text-base font-bold text-[#333]">
                {poi.placeName}
              </div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-[#666]">
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
  // 백엔드에서 가져온 장소 데이터 상태
  const [places, setPlaces] = useState<PlaceDto[]>([]);
  // 디바운스를 위한 타이머 ref
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 선택된 백엔드 장소 상태
  const [selectedBackendPlace, setSelectedBackendPlace] = useState<PlaceDto | null>(null);
  // summary 펼치기/접기 상태
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  /**
   * 지도 영역 내의 장소 데이터를 가져오는 함수
   */
  const fetchPlacesInView = useCallback(async (map: kakao.maps.Map) => {
    try {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest(); // 남서쪽 좌표
      const ne = bounds.getNorthEast(); // 북동쪽 좌표

      const mapBounds = {
        swLat: sw.getLat(),
        swLng: sw.getLng(),
        neLat: ne.getLat(),
        neLng: ne.getLng(),
      };

      console.log('Fetching places for bounds:', mapBounds);
      const placesData = await fetchPlacesInBounds(mapBounds);
      console.log('Received places:', placesData);
      setPlaces(placesData);
    } catch (error) {
      console.error('Failed to fetch places:', error);
    }
  }, []);

  /**
   * 지도 이동/줌 변경 시 디바운스된 장소 데이터 요청
   */
  const handleMapBoundsChanged = useCallback(
    (map: kakao.maps.Map) => {
      // 기존 타이머가 있으면 취소
      if (fetchTimerRef.current) {
        clearTimeout(fetchTimerRef.current);
      }

      // 500ms 후에 API 요청 (디바운스)
      fetchTimerRef.current = setTimeout(() => {
        fetchPlacesInView(map);
      }, 500);
    },
    [fetchPlacesInView]
  );

  /**
   * 백엔드 장소 마커 클릭 시 처리
   */
  const handlePlaceClick = useCallback((place: PlaceDto) => {
    setSelectedBackendPlace(place);
    setIsSummaryExpanded(false); // 새로운 장소 선택 시 summary 접기

    // 지도가 있으면 해당 위치로 포커싱 및 줌 조정
    if (mapInstance) {
      const position = new window.kakao.maps.LatLng(place.latitude, place.longitude);

      // 줌 레벨을 먼저 설정한 후 중앙으로 이동
      mapInstance.setLevel(5);

      // setCenter를 사용하여 정확한 위치로 이동
      mapInstance.setCenter(position);
    }
  }, [mapInstance]);

  // 지도 인스턴스가 생성되면 초기 장소 데이터 로드
  useEffect(() => {
    if (mapInstance) {
      fetchPlacesInView(mapInstance);
    }
    
    return () => {
        if (fetchTimerRef.current) {
            clearTimeout(fetchTimerRef.current);
        }
    };
  }, [mapInstance, fetchPlacesInView]);

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
                route.sections.forEach((section: {
                  duration: number;
                  distance: number;
                  roads: Array<{ vertexes: number[] }>;
                }, index: number) => {
                  const detailedPath: { lat: number; lng: number }[] = [];
                  section.roads.forEach((road) => {
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
    <div className="relative h-full w-full">
      <KakaoMap
        center={{ lat: 33.450701, lng: 126.570667 }}
        className="h-full w-full"
        level={3}
        onCreate={(map) => {
          if (mapRef) {
            (mapRef as React.MutableRefObject<kakao.maps.Map>).current = map;
            setMapInstance(map);
          }
        }}
        onCenterChanged={(map) => {
          // 지도 중심이 변경될 때마다 호출
          handleMapBoundsChanged(map);
        }}
        onZoomChanged={(map) => {
          // 줌 레벨이 변경될 때마다 호출
          handleMapBoundsChanged(map);
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

        {/* 백엔드에서 가져온 장소 마커 렌더링 */}
        {places.map((place) => (
          <PlaceMarker key={place.id} place={place} onPlaceClick={handlePlaceClick} />
        ))}

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
                  <div className="whitespace-nowrap rounded bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#333] shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
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
        <div className="absolute left-2.5 top-2.5 z-20 rounded bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-md">
          데이터 동기화 중...
        </div>
      )}

      {/* 선택된 백엔드 장소 상세 정보 사이드 패널 */}
      {selectedBackendPlace && (
        <div className="absolute right-5 top-5 z-10 flex w-[280px] max-h-[70vh] flex-col overflow-y-auto rounded-[10px] bg-white shadow-[0_6px_20px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between border-b border-[#e0e0e0] px-4 py-3">
            <h2 className="text-[16px] font-bold text-[#222]">장소 정보</h2>
            <button
              onClick={() => setSelectedBackendPlace(null)}
              className="flex h-6 w-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-xl leading-none text-[#666]"
              aria-label="닫기"
              type="button"
            >
              ×
            </button>
          </div>
          <div className="relative w-full border-b border-[#e0e0e0]">
            {selectedBackendPlace.image_url && (
              <img
                src={selectedBackendPlace.image_url}
                alt={selectedBackendPlace.title}
                className="h-[150px] w-full object-cover"
              />
            )}
          </div>
          <div className="flex flex-col gap-3 p-4">
            <h3 className="mb-2.5 text-lg font-bold text-[#222]">
              {selectedBackendPlace.title}
            </h3>
            <div
              className="mb-3 inline-block rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
              style={{
                backgroundColor:
                  CATEGORY_INFO[selectedBackendPlace.category as keyof typeof CATEGORY_INFO]?.color || '#808080',
              }}
            >
              {CATEGORY_INFO[selectedBackendPlace.category as keyof typeof CATEGORY_INFO]?.name || '기타'}
            </div>

            {selectedBackendPlace.summary && (
              <div className="mb-4 rounded border-l-[3px] border-[#4caf50] bg-[#f8f9fa] p-3">
                <p
                  className={`m-0 text-[13px] leading-relaxed text-[#555] ${
                    isSummaryExpanded ? '' : 'line-clamp-3'
                  }`}
                >
                  {selectedBackendPlace.summary}
                </p>
                {selectedBackendPlace.summary.length > 100 && (
                  <button
                    onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                    className="mt-1.5 border-0 bg-transparent p-0 text-xs font-bold text-[#4caf50] underline"
                    type="button"
                  >
                    {isSummaryExpanded ? '접기' : '자세히보기'}
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => {
                const poiData = {
                  latitude: selectedBackendPlace.latitude,
                  longitude: selectedBackendPlace.longitude,
                  address: selectedBackendPlace.address,
                  placeName: selectedBackendPlace.title,
                  categoryName: selectedBackendPlace.category,
                };
                markPoi(poiData);
                setSelectedBackendPlace(null);
              }}
              className="w-full rounded bg-[#4caf50] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#45a049]"
              type="button"
            >
              여행지에 추가
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
