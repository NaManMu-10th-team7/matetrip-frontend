// 백엔드 enum(GENDER)과 맞춘 성별 값
export const GENDER_TYPES = {
  MALE: '남성',
  FEMALE: '여성',
} as const;

// 위 상수 맵을 바탕으로 value(문자열 리터럴)만 추출해 만든 타입
// → 새 항목을 추가하면 타입도 자동으로 확장되므로 값/타입이 항상 동기화됨
//여기서는 남성과 여성을 추출한다
export type GenderType = (typeof GENDER_TYPES)[keyof typeof GENDER_TYPES];

// 드롭다운에 보여줄 옵션 리스트
// UI에서 쓸 한글 라벨과 실제 값(value)을 묶은 옵션 리스트
export const GENDER_OPTIONS: ReadonlyArray<{
  value: GenderType;
  label: string;
}> = [
  { value: GENDER_TYPES.MALE, label: '남성' }, //남성 남성
  { value: GENDER_TYPES.FEMALE, label: '여성' }, // 여성 여성
] as const;
