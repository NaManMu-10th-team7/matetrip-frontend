// 백엔드 enum 값과 동일하게 맞춰둔 상수 맵
export const TRAVEL_STYLE_TYPES = {
  RELAXED: 'RELAXED',
  ACTIVE: 'ACTIVE',
  CULTURAL: 'CULTURAL',
  FOODIE: 'FOODIE',
  NATURE: 'NATURE',
} as const;

// 위 상수 맵을 바탕으로 value(문자열 리터럴)만 추출해 만든 타입
// → 새 항목을 추가하면 타입도 자동으로 확장되므로 값/타입이 항상 동기화됨
export type TravelStyleType =
  (typeof TRAVEL_STYLE_TYPES)[keyof typeof TRAVEL_STYLE_TYPES];

// UI에서 쓸 한글 라벨과 실제 값(value)을 묶은 옵션 리스트
// 실제 값은 TRAVEL_STYLE_TYPES를 참조해서 오타 없이 재사용한다
export const TRAVEL_STYLE_OPTIONS: ReadonlyArray<{
  value: TravelStyleType;
  label: string;
}> = [
  { value: TRAVEL_STYLE_TYPES.RELAXED, label: '힐링' },
  { value: TRAVEL_STYLE_TYPES.ACTIVE, label: '액티비티' },
  { value: TRAVEL_STYLE_TYPES.CULTURAL, label: '문화 탐방' },
  { value: TRAVEL_STYLE_TYPES.FOODIE, label: '맛집 투어' },
  { value: TRAVEL_STYLE_TYPES.NATURE, label: '자연/사진' },
] as const;
