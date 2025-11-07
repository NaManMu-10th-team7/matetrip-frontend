import { useState, useEffect } from 'react';
import axios from 'axios';
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

  useEffect(() => {
    const fetchAllRoutes = async () => {
      if (!KAKAO_REST_API_KEY) {
        console.error('Kakao REST API Key가 설정되지 않았습니다.');
        return;
      }

      setIsLoading(true);
      const newRoutePaths: DailyRoutePaths = {};

      for (const dayId in itinerary) {
        const pois = itinerary[dayId];
        if (pois.length < 2) continue; // POI가 2개 이상일 때만 경로 탐색

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
        }
      }
      setRoutePaths(newRoutePaths);
      setIsLoading(false);
    };

    fetchAllRoutes();
  }, [itinerary]); // itinerary가 변경될 때마다 경로를 다시 계산

  return { routePaths, isLoading };
}