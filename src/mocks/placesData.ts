import type { PlaceDto } from '../types/place';

/**
 * 테스트용 Mock 장소 데이터
 * 제주도 중심으로 다양한 카테고리의 장소들
 * 카테고리: 레포츠, 추천코스, 인문(문화/예술/역사), 자연
 */
export const MOCK_PLACES: PlaceDto[] = [
  // 자연
  {
    id: 'mock-place-3',
    category: '자연',
    title: '성산일출봉',
    address: '제주특별자치도 서귀포시 성산읍 일출로',
    summary:
      '유네스코 세계자연유산으로 지정된 제주의 대표 관광지. 일출 명소로 유명합니다.',
    image_url:
      'https://images.unsplash.com/photo-1559666126-84f389727b9a?w=400',
    longitude: 126.942222,
    latitude: 33.458333,
  },
  {
    id: 'mock-place-4',
    category: '자연',
    title: '한라산 국립공원',
    address: '제주특별자치도 제주시 해안동',
    summary: '대한민국에서 가장 높은 산. 등산과 트레킹 코스가 다양합니다.',
    image_url:
      'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400',
    longitude: 126.533333,
    latitude: 33.362222,
  },
  {
    id: 'mock-place-5',
    category: '자연',
    title: '우도',
    address: '제주특별자치도 제주시 우도면',
    summary: '제주 동쪽의 작은 섬. 아름다운 해변과 독특한 풍경이 매력적입니다.',
    image_url:
      'https://images.unsplash.com/photo-1598954889084-e0e8b8c50c9f?w=400',
    longitude: 126.958333,
    latitude: 33.504167,
  },
  {
    id: 'mock-place-8',
    category: '자연',
    title: '비자림',
    address: '제주특별자치도 제주시 조천읍',
    summary: '500~800년된 비자나무 2,800여 그루가 밀집해 있는 숲',
    image_url:
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400',
    longitude: 126.635833,
    latitude: 33.528889,
  },
  {
    id: 'mock-place-6',
    category: '자연',
    title: '용머리해안',
    address: '제주특별자치도 서귀포시 안덕면 사계리',
    summary: '바다가 한눈에 보이는 아름다운 해안 절벽',
    image_url:
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
    longitude: 126.308889,
    latitude: 33.231944,
  },

  // 인문(문화/예술/역사)
  {
    id: 'mock-place-11',
    category: '인문(문화/예술/역사)',
    title: '제주 국립박물관',
    address: '제주특별자치도 제주시 일주동로',
    summary: '제주의 역사와 문화를 한눈에 볼 수 있는 박물관',
    image_url:
      'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=400',
    longitude: 126.519722,
    latitude: 33.509444,
  },
  {
    id: 'mock-place-12',
    category: '인문(문화/예술/역사)',
    title: '제주 아트센터',
    address: '제주특별자치도 제주시 연동',
    summary: '다양한 공연과 전시가 열리는 복합 문화 공간',
    image_url:
      'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400',
    longitude: 126.483333,
    latitude: 33.489444,
  },
  {
    id: 'mock-place-13',
    category: '인문(문화/예술/역사)',
    title: '섭지코지 미술관',
    address: '제주특별자치도 서귀포시 성산읍',
    summary: '아름다운 해안 풍경과 함께 즐기는 현대 미술관',
    image_url:
      'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=400',
    longitude: 126.925833,
    latitude: 33.425556,
  },
  {
    id: 'mock-place-14',
    category: '인문(문화/예술/역사)',
    title: '제주민속촌',
    address: '제주특별자치도 제주시 삼도2동',
    summary: '제주 전통 민속 문화를 체험할 수 있는 곳',
    longitude: 126.529167,
    latitude: 33.510833,
  },

  // 레포츠
  {
    id: 'mock-place-16',
    category: '레포츠',
    title: '제주 패러글라이딩',
    address: '제주특별자치도 서귀포시 중문동',
    summary: '제주 바다를 한눈에 내려다보며 즐기는 패러글라이딩',
    image_url:
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400',
    longitude: 126.411944,
    latitude: 33.253611,
  },
  {
    id: 'mock-place-17',
    category: '레포츠',
    title: '서핑 비치',
    address: '제주특별자치도 제주시 한경면',
    summary: '제주 최고의 서핑 명소',
    image_url:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
    longitude: 126.183333,
    latitude: 33.333333,
  },
  {
    id: 'mock-place-18',
    category: '레포츠',
    title: '제주 올레길 스타트',
    address: '제주특별자치도 제주시 애월읍',
    summary: '올레길 트레킹의 출발점',
    image_url:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    longitude: 126.320833,
    latitude: 33.464722,
  },

  // 추천코스
  {
    id: 'mock-place-19',
    category: '추천코스',
    title: '제주 동쪽 일주 코스',
    address: '제주특별자치도 제주시 조천읍 북촌리',
    summary: '제주 동쪽의 아름다운 명소를 한 번에 둘러볼 수 있는 추천 코스',
    longitude: 126.708333,
    latitude: 33.543056,
  },
  {
    id: 'mock-place-20',
    category: '추천코스',
    title: '제주 서쪽 해안 드라이브',
    address: '제주특별자치도 서귀포시 중문동',
    summary: '석양이 아름다운 서쪽 해안을 따라가는 드라이브 코스',
    longitude: 126.415944,
    latitude: 33.255611,
  },
  {
    id: 'mock-place-1',
    category: '추천코스',
    title: '제주 맛집 투어',
    address: '제주특별자치도 제주시 구좌읍 해맞이해안로',
    summary: '제주의 대표 맛집들을 둘러보는 미식 투어 코스',
    image_url:
      'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400',
    longitude: 126.571667,
    latitude: 33.451701,
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
      place.latitude != null &&
      place.longitude != null &&
      place.latitude >= swLat &&
      place.latitude <= neLat &&
      place.longitude >= swLng &&
      place.longitude <= neLng
  );
}
