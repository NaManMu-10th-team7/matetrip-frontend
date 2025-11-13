/**
 * 백엔드에서 제공하는 장소 데이터 DTO
 */
export interface PlaceDto {
  id: string;
  categories: CategoryCode; // 카테고리 코드 (예: "FD6", "AT4", "CE7", "AD5", "CT1")
  title: string;
  address: string;
  summary?: string; // 요약 설명
  image_url?: string;
  longitude: number;
  latitude: number;
}

/**
 * 카테고리 코드와 이름 매핑
 */
export const CATEGORY_INFO = {
  FD6: { name: '음식점', color: '#FF6B6B' },
  AT4: { name: '관광명소', color: '#4ECDC4' },
  CE7: { name: '카페', color: '#45B7D1' },
  AD5: { name: '숙박', color: '#96CEB4' },
  CT1: { name: '문화시설', color: '#FFEAA7' },
} as const;

export type CategoryCode = keyof typeof CATEGORY_INFO;

/**
 * 지도 영역 정보 (bounding box)
 */
export interface MapBounds {
  swLat: number; // 남서쪽 위도
  swLng: number; // 남서쪽 경도
  neLat: number; // 북동쪽 위도
  neLng: number; // 북동쪽 경도
}
