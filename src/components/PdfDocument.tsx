import React from 'react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';
import type { Poi } from '../hooks/usePoiSocket';
import type { DayLayer } from '../types/map';

interface PdfDocumentProps {
  workspaceName: string;
  itinerary: Record<string, Poi[]>;
  dayLayers: DayLayer[];
}

/**
 * 주어진 POI 목록을 모두 포함하는 지도의 중심점과 확대 레벨을 계산합니다.
 */
const getMapBounds = (pois: Poi[]) => {
  if (!pois || pois.length === 0) {
    return {
      center: { lat: 37.5665, lng: 126.978 }, // 기본값: 서울 시청
      level: 7,
    };
  }

  const bounds = new window.kakao.maps.LatLngBounds();
  pois.forEach((poi) => {
    bounds.extend(new window.kakao.maps.LatLng(poi.latitude, poi.longitude));
  });

  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  const center = {
    lat: (sw.getLat() + ne.getLat()) / 2,
    lng: (sw.getLng() + ne.getLng()) / 2,
  };

  let level = 7;
  if (pois.length > 1) {
    const dx = ne.getLng() - sw.getLng();
    const dy = ne.getLat() - sw.getLat();
    const zoomLevel = Math.max(dx, dy);

    if (zoomLevel > 0.8) level = 11;
    else if (zoomLevel > 0.4) level = 10;
    else if (zoomLevel > 0.2) level = 9;
    else if (zoomLevel > 0.1) level = 8;
    else if (zoomLevel > 0.05) level = 7;
    else if (zoomLevel > 0.025) level = 6;
    else level = 5;
  }

  return { center, level };
};

/**
 * 인터랙티브 Map을 사용하여 PDF용 지도 이미지를 렌더링하는 컴포넌트
 */
const PdfInteractiveMap = ({ pois }: { pois: Poi[] }) => {
  const { center, level } = getMapBounds(pois);

  return (
    <div
      className="mb-6 border rounded-lg overflow-hidden"
      style={{ width: '100%', height: '400px' }}
    >
      <Map
        center={center}
        level={level}
        style={{ width: '100%', height: '100%' }}
        // PDF 출력을 위해 모든 상호작용 비활성화
        isPanto={false}
        draggable={false}
        scrollwheel={false}
        zoomable={false}
        keyboardShortcuts={false}
      >
        {pois.map((poi, index) => (
          <MapMarker
            key={poi.id}
            position={{ lat: poi.latitude, lng: poi.longitude }}
            // 마커 핀 이미지 대신 커스텀 오버레이(숫자)를 표시합니다.
            // 외부 URL 대신 데이터 URI를 사용하여 CORS 오류를 원천적으로 방지합니다.
            image={{
              src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
              size: { width: 1, height: 1 },
              options: { offset: { x: 0, y: 0 } },
            }}
          >
            <div
              style={{
                padding: '2px 6px',
                background: '#F87171', // Tailwind red-400
                color: 'white',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                textAlign: 'center',
                border: '1px solid white',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {index + 1}
            </div>
          </MapMarker>
        ))}
      </Map>
    </div>
  );
};

export const PdfDocument = React.forwardRef<HTMLDivElement, PdfDocumentProps>(
  ({ workspaceName, itinerary, dayLayers }, ref) => {
    return (
      // PDF로 변환할 전체 영역입니다.
      <div
        ref={ref}
        className="p-8 bg-white"
        style={{ width: '210mm', minHeight: '297mm' }}
      >
        <h1 className="text-3xl font-bold mb-8 border-b pb-4">
          {workspaceName} 여행 계획
        </h1>

        {dayLayers.map((day, dayIndex) => {
          const poisForDay = itinerary[day.id] || [];
          if (poisForDay.length === 0) return null;

          return (
            <div key={day.id} className="mb-10" style={{ breakInside: 'avoid' }}>
              <h2
                className="text-2xl font-semibold mb-4"
                style={{ color: day.color }}
              >
                Day {dayIndex + 1} - {day.label}
              </h2>

              {/* 새로운 인터랙티브 지도 컴포넌트 사용 */}
              <PdfInteractiveMap pois={poisForDay} />

              {/* 장소 목록 */}
              <ul className="space-y-3">
                {poisForDay.map((poi, index) => (
                  <li key={poi.id} className="flex items-start">
                    <span
                      className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-white text-sm mr-4 mt-1"
                      style={{ backgroundColor: day.color }}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-bold text-lg">{poi.placeName}</p>
                      <p className="text-sm text-gray-600">{poi.address}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    );
  }
);

PdfDocument.displayName = 'PdfDocument';
