// 16가지 MBTI 목록 (value와 label 동일)
// 백엔드 enum(GENDER)과 맞춘 MBTI 값
export const MBTI_TYPES = [
  'ISTJ',
  'ISFJ',
  'INFJ',
  'INTJ',
  'ISTP',
  'ISFP',
  'INFP',
  'INTP',
  'ESTP',
  'ESFP',
  'ENFP',
  'ENTP',
  'ESTJ',
  'ESFJ',
  'ENFJ',
  'ENTJ',
] as const;

// 위 상수 맵을 바탕으로 value(문자열 리터럴)만 추출해 만든 타입
export type MbtiType = (typeof MBTI_TYPES)[number];

// UI에서 쓸 한글 라벨과 실제 값(value)을 묶은 옵션 리스트
export const MBTI_OPTIONS: ReadonlyArray<{
  value: MbtiType;
  label: string;
}> = MBTI_TYPES.map((type) => ({ value: type, label: type }));
//MBTI_TYPES.map((type) => ...) → MBTI_TYPES 배열을 순회하며 각 원소를 type으로 받아 새 배열을 만듭니다.
