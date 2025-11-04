// 예: 서버 enum과 맞춘 상수
export const TRAVEL_TENDENCY_TYPE = {
  INTROVERT: '내향적',
  EXTROVERT: '외향적',
} as const;

export type TravelTendencyType =
  (typeof TRAVEL_TENDENCY_TYPE)[keyof typeof TRAVEL_TENDENCY_TYPE]; //value 만 뽑기

export const TENDENCY_OPTIONS: ReadonlyArray<{
  value: TravelTendencyType;
  label: string;
}> = (Object.values(TRAVEL_TENDENCY_TYPE) as TravelTendencyType[]).map(
  (label) => ({
    //TENDENCY_TYPE 객체의 값만 뽑아 배열(['내향적', '외향적'])로 만든 뒤(values)
    //위에서 얻은 배열을 map으로 순회하며 각 문자열을 label이라는 이름으로 받습니다.
    value: label, // '내향적' | '외향적'
    label, // UI 표시도 동일
  })
);
