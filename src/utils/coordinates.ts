import type { Poi } from '../hooks/usePoiSocket';

/**
 * 좌표 비교 시 사용할 허용 오차.
 * 0.000001도는 약 11cm에 해당하여 충분히 정밀합니다.
 */
const COORDINATE_TOLERANCE = 0.000001;

/**
 * 주어진 좌표와 허용 오차 내에서 일치하는 POI를 찾습니다.
 * 부동소수점 정밀도 문제로 인한 매칭 실패를 방지합니다.
 */
export const findPoiByCoordinates = (
  pois: Poi[],
  latitude: number,
  longitude: number
): Poi | undefined =>
  pois.find(
    (p) =>
      Math.abs(p.latitude - latitude) < COORDINATE_TOLERANCE &&
      Math.abs(p.longitude - longitude) < COORDINATE_TOLERANCE
  );
