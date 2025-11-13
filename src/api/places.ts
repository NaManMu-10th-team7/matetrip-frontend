import client from './client';
import type { PlaceDto, MapBounds } from '../types/place';
import { MOCK_PLACES, filterPlacesByBounds } from '../mocks/placesData';

// Mock 데이터 사용 여부 (백엔드 준비 전까지 true로 설정)
const USE_MOCK_DATA = true;

/**
 * 지도 영역 내의 장소 데이터를 가져옵니다
 * @param bounds - 지도 영역 정보 (bounding box)
 * @returns 장소 데이터 배열
 */
export async function fetchPlacesInBounds(
  bounds: MapBounds
): Promise<PlaceDto[]> {
  // Mock 데이터 사용 시
  // if (USE_MOCK_DATA) {
  //   // 실제 API 호출처럼 약간의 지연 시간 추가
  //   await new Promise((resolve) => setTimeout(resolve, 300));

  //   const filteredPlaces = filterPlacesByBounds(
  //     MOCK_PLACES,
  //     bounds.swLat,
  //     bounds.swLng,
  //     bounds.neLat,
  //     bounds.neLng
  //   );
  //   // 임시라 그냥 mock 데이터용으로 변수명

  //   console.log(
  //     `[MOCK] Found ${filteredPlaces.length} places in bounds:`,
  //     bounds
  //   );
  //   return filteredPlaces;
  // }

  // 실제 API 호출
  try {
    const response = await client.get<PlaceDto[]>('/places', {
      params: {
        southWestLatitude: bounds.swLat,
        southWestLongitude: bounds.swLng,
        northEastLatitude: bounds.neLat,
        northEastLongitude: bounds.neLng,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching places:', error);
    throw error;
  }
}
