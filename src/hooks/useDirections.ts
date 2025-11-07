import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import type { Poi } from './usePoiSocket';

type Itinerary = Record<string, Poi[]>;
type LatLng = { lat: number; lng: number };
type DailyRoutePaths = Record<string, LatLng[]>;

const KAKAO_REST_API_KEY = import.meta.env.VITE_REACT_APP_KAKAOMAP_REST_KEY;

/**
 * 카카오모빌리티 길찾기 API(경유지)를 사용하여 전체 경로를 계산하는 훅
 * @param itinerary - 날짜별로 정리된 POI 배열 객체
 */
export function useDirections(itinerary: Itinerary) {
  const [routePaths, setRoutePaths] = useState<DailyRoutePaths>({});
  const [isLoading, setIsLoading] = useState(false);
  const prevItineraryRef = useRef<Itinerary>();

  useEffect(() => {
    const fetchAllRoutes = async () => {
      if (!KAKAO_REST_API_KEY) {
        console.error('Kakao REST API Key가 설정되지 않았습니다.');
        return;
      }

      setIsLoading(true);
      // 이전 경로를 기반으로 시작하여 변경되지 않은 경로는 유지합니다.
      const newRoutePaths: DailyRoutePaths = { ...routePaths };
      const prevItinerary = prevItineraryRef.current;

      for (const dayId in itinerary) {
        const pois = itinerary[dayId];

        // 이전 itinerary와 현재 itinerary의 POI 목록을 비교합니다.
        // ID 배열을 JSON 문자열로 변환하여 간단하게 비교합니다.
        const currentPoiIds = JSON.stringify(pois.map((p) => p.id));
        const previousPoiIds = JSON.stringify(
          prevItinerary?.[dayId]?.map((p) => p.id) || []
        );

        // POI 목록에 변경이 없으면 API 호출을 건너뜁니다.
        if (currentPoiIds === previousPoiIds) {
          continue;
        }

        console.log(`[${dayId}] 일정이 변경되어 경로를 다시 계산합니다.`);

        // POI가 2개 미만이면 경로를 지우고 다음으로 넘어갑니다.
        if (pois.length < 2) {
          delete newRoutePaths[dayId];
          continue;
        }

        const origin = `${pois[0].longitude},${pois[0].latitude}`;
        const destination = `${pois[pois.length - 1].longitude},${
          pois[pois.length - 1].latitude
        }`;
        const waypoints =
          pois.length > 2
            ? pois
                .slice(1, -1)
                .map((p) => `${p.longitude},${p.latitude}`)
                .join('|')
            : undefined;

        try {
          const response = await axios.get(
            'https://apis-navi.kakaomobility.com/v1/directions', // 경유지 API도 동일한 엔드포인트를 사용합니다.
            {
              headers: {
                Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
                'Content-Type': 'application/json',
              },
              params: { origin, destination, waypoints },
            }
          );

          const route = response.data.routes[0];
          if (route) {
            // API 응답에서 경로 좌표(vertexes)를 추출하여 Polyline이 요구하는 형식으로 변환
            const path: LatLng[] = [];
            route.sections.forEach((section: any) => {
              section.roads.forEach((road: any) => {
                for (let i = 0; i < road.vertexes.length; i += 2) {
                  path.push({ lat: road.vertexes[i + 1], lng: road.vertexes[i] });
                }
              });
            });
            newRoutePaths[dayId] = path;
          }
        } catch (error) {
          console.error(`[${dayId}] 경로 계산 중 오류 발생:`, error);
          // 오류 발생 시 해당 날짜의 경로를 제거하여 잘못된 경로가 표시되지 않도록 합니다.
          delete newRoutePaths[dayId];
        }
      }
      setRoutePaths(newRoutePaths);
      setIsLoading(false);
      // 현재 itinerary를 다음 비교를 위해 ref에 저장합니다.
      prevItineraryRef.current = itinerary;
    };

    fetchAllRoutes();
  }, [itinerary]); // itinerary가 변경될 때마다 경로를 다시 계산

  return { routePaths, isLoading };
}