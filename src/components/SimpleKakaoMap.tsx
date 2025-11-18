import { Map as KakaoMap, MapMarker, CustomOverlayMap } from 'react-kakao-maps-sdk';

interface SimpleKakaoMapProps {
  latitude: number;
  longitude: number;
  placeName: string;
}

export function SimpleKakaoMap({ latitude, longitude, placeName }: SimpleKakaoMapProps) {
  // latitude, longitude가 유효한지 확인
  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
    console.error('Invalid coordinates:', { latitude, longitude });
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">위치 정보를 불러올 수 없습니다</p>
          <p className="text-sm text-gray-500 mt-2">
            lat: {latitude}, lng: {longitude}
          </p>
        </div>
      </div>
    );
  }

  return (
    <KakaoMap
      center={{ lat: latitude, lng: longitude }}
      style={{ width: '100%', height: '100%' }}
      level={3}
    >
      <MapMarker position={{ lat: latitude, lng: longitude }} />
      <CustomOverlayMap position={{ lat: latitude, lng: longitude }} yAnchor={2.3}>
        <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900">{placeName}</p>
        </div>
      </CustomOverlayMap>
    </KakaoMap>
  );
}

