// 백엔드에서 받은 영문 키워드를 한글로 변환하기 위한 맵
// TODO: 추후 백엔드와 협의하여 정확한 값으로 변경해야 합니다.
const KEYWORD_MAP: { [key: string]: string } = {
  // 여행 키워드 (백엔드 enum 기반)
  CITY_NIGHT_VIBE: '도심/야경 위주',
  NATURE_VIBE: '자연 위주',
  BEACH_RESORT: '바다/리조트 휴양',
  LOCAL_TOWN_SLOW: '로컬 동네/시골 감성',
  FOOD_TOUR: '맛집/먹방 중심',
  CAFE_PHOTO: '카페/포토 스팟 탐방',
  LIGHT_OUTDOOR: '가벼운 야외활동',
  HARD_OUTDOOR: '강한 액티비티',
  CULTURE_FESTIVAL: '전시/유적/축제/공연 중심',
  PACE_CHILL: '여유로운 일정',
  PACE_TIGHT: '빡빡한 일정',
  BUDGET_FRIENDLY_TRIP: '가성비 중시',
  COMFORT_HEALING_TRIP: '편안한 휴양/힐링 중시',
  SMALL_CHILL_CREW: '소수/조용한 동행 선호',
  ACTIVE_SOCIAL_CREW: '활발/수다 많은 동행 선호',
  // FOOD: '음식',
  // ACCOMMODATION: '숙박',
  // ACTIVITY: '액티비티',
  // TRANSPORT: '교통',
  // // MainPostCard.tsx 와 SearchResults.tsx 의 mock 데이터에 있는 키워드 추가
  // 힐링: '힐링',
  // 자연: '자연',
  // 맛집투어: '맛집투어',
};

export const translateKeyword = (keyword: string) =>
  KEYWORD_MAP[keyword.toUpperCase()] || keyword;
