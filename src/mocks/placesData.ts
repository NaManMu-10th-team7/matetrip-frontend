import type { PlaceDto } from '../types/place';

/**
 * 테스트용 Mock 장소 데이터
 * 제주도 중심으로 다양한 카테고리의 장소들
 */
export const MOCK_PLACES: PlaceDto[] = [
  // 음식점 (FD6)
  {
    id: 'mock-place-1',
    categories: 'FD6',
    title: '흑돼지 맛집',
    address: '제주특별자치도 제주시 구좌읍 해맞이해안로',
    summary: '제주 흑돼지 구이 전문점. 두툼한 고기와 신선한 야채를 함께 즐길 수 있습니다.',
    image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400',
    longitude: 126.571667,
    latitude: 33.451701,
  },
  {
    id: 'mock-place-2',
    categories: 'FD6',
    title: '제주 해산물 레스토랑',
    address: '제주특별자치도 제주시 한림읍',
    summary: '신선한 제주 바다의 해산물을 맛볼 수 있는 곳',
    image_url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400',
    longitude: 126.266667,
    latitude: 33.411111,
  },

  // 관광명소 (AT4)
  {
    id: 'mock-place-3',
    categories: 'AT4',
    title: '성산일출봉',
    address: '제주특별자치도 서귀포시 성산읍 일출로',
    summary: '유네스코 세계자연유산으로 지정된 제주의 대표 관광지. 일출 명소로 유명합니다.',
    image_url: 'https://images.unsplash.com/photo-1559666126-84f389727b9a?w=400',
    longitude: 126.942222,
    latitude: 33.458333,
  },
  {
    id: 'mock-place-4',
    categories: 'AT4',
    title: '한라산 국립공원',
    address: '제주특별자치도 제주시 해안동',
    summary: '대한민국에서 가장 높은 산. 등산과 트레킹 코스가 다양합니다.',
    image_url: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400',
    longitude: 126.533333,
    latitude: 33.362222,
  },
  {
    id: 'mock-place-5',
    categories: 'AT4',
    title: '우도',
    address: '제주특별자치도 제주시 우도면',
    summary: '제주 동쪽의 작은 섬. 아름다운 해변과 독특한 풍경이 매력적입니다.',
    image_url: 'https://images.unsplash.com/photo-1598954889084-e0e8b8c50c9f?w=400',
    longitude: 126.958333,
    latitude: 33.504167,
  },

  // 카페 (CE7)
  {
    id: 'mock-place-6',
    categories: 'CE7',
    title: '오션뷰 카페',
    address: '제주특별자치도 서귀포시 안덕면 사계리',
    summary: '바다가 한눈에 보이는 루프탑 카페. 커피와 디저트가 맛있습니다.',
    image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
    longitude: 126.308889,
    latitude: 33.231944,
  },
  {
    id: 'mock-place-7',
    categories: 'CE7',
    title: '제주 감귤 카페',
    address: '제주특별자치도 제주시 애월읍',
    summary: '제주 감귤을 활용한 다양한 음료와 디저트를 즐길 수 있는 카페',
    image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    longitude: 126.320833,
    latitude: 33.464722,
  },
  {
    id: 'mock-place-8',
    categories: 'CE7',
    title: '숲속의 카페',
    address: '제주특별자치도 제주시 조천읍',
    summary: '제주 숲 속에 위치한 조용하고 아늑한 카페',
    image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400',
    longitude: 126.635833,
    latitude: 33.528889,
  },

  // 숙박 (AD5)
  {
    id: 'mock-place-9',
    categories: 'AD5',
    title: '제주 리조트 호텔',
    address: '제주특별자치도 서귀포시 중문동',
    summary: '중문 관광단지 내 5성급 리조트. 수영장과 스파 시설 완비',
    image_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400',
    longitude: 126.411944,
    latitude: 33.253611,
  },
  {
    id: 'mock-place-10',
    categories: 'AD5',
    title: '바다뷰 펜션',
    address: '제주특별자치도 제주시 한경면',
    summary: '오션뷰가 아름다운 프라이빗 펜션',
    image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
    longitude: 126.183333,
    latitude: 33.333333,
  },

  // 문화시설 (CT1)
  {
    id: 'mock-place-11',
    categories: 'CT1',
    title: '제주 국립박물관',
    address: '제주특별자치도 제주시 일주동로',
    summary: '제주의 역사와 문화를 한눈에 볼 수 있는 박물관',
    image_url: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=400',
    longitude: 126.519722,
    latitude: 33.509444,
  },
  {
    id: 'mock-place-12',
    categories: 'CT1',
    title: '제주 아트센터',
    address: '제주특별자치도 제주시 연동',
    summary: '다양한 공연과 전시가 열리는 복합 문화 공간',
    image_url: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400',
    longitude: 126.483333,
    latitude: 33.489444,
  },
  {
    id: 'mock-place-13',
    categories: 'CT1',
    title: '섭지코지 미술관',
    address: '제주특별자치도 서귀포시 성산읍',
    summary: '아름다운 해안 풍경과 함께 즐기는 현대 미술관',
    image_url: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=400',
    longitude: 126.925833,
    latitude: 33.425556,
  },

  // 추가 장소들 (다양한 위치에 분산)
  {
    id: 'mock-place-14',
    categories: 'FD6',
    title: '고기국수 전문점',
    address: '제주특별자치도 제주시 삼도2동',
    summary: '제주 전통 고기국수의 진수를 맛볼 수 있는 곳',
    longitude: 126.529167,
    latitude: 33.510833,
  },
  {
    id: 'mock-place-15',
    categories: 'CE7',
    title: '제주 북촌 카페거리',
    address: '제주특별자치도 제주시 조천읍 북촌리',
    summary: '아기자기한 카페들이 모여있는 카페거리',
    longitude: 126.708333,
    latitude: 33.543056,
  },
];

/**
 * 지도 영역 내의 장소를 필터링하는 함수
 */
export function filterPlacesByBounds(
  places: PlaceDto[],
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number
): PlaceDto[] {
  return places.filter(
    (place) =>
      place.latitude >= swLat &&
      place.latitude <= neLat &&
      place.longitude >= swLng &&
      place.longitude <= neLng
  );
}
