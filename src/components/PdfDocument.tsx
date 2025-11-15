import React, { useEffect, useRef } from 'react';
import { StaticMap, type StaticMapProps } from 'react-kakao-maps-sdk';
import type { Poi } from '../hooks/usePoiSocket';
import type { DayLayer } from '../types/map';
import { API_BASE_URL } from '../api/client';

interface PdfDocumentProps {
  workspaceName: string;
  itinerary: Record<string, Poi[]>;
  dayLayers: DayLayer[];
}

/**
 * 주어진 POI 목록을 모두 포함하는 지도의 중심점과 확대 레벨을 계산합니다.
 * @param pois - 좌표를 포함하는 POI 객체 배열
 * @returns 지도의 center(lat, lng)와 level
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

  // 지도 레벨은 직접 계산하기 복잡하므로, StaticMap이 자동으로 조정하도록 level을 지정하지 않거나,
  // 실험적으로 적절한 값을 찾아서 사용할 수 있습니다.
  // 여기서는 간단하게 POI 개수에 따라 레벨을 조절하는 예시를 보여줍니다.
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
 * StaticMap을 래핑하여 이미지 URL을 프록시로 교체하는 컴포넌트
 */
const PdfMapImage = (props: StaticMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // MutationObserver를 사용하여 img 태그가 생성되는 것을 감지합니다.
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const imgElement = mapContainerRef.current?.querySelector('img');
          // img 태그가 있고, src가 아직 프록시 URL이 아닌 경우에만 실행합니다.
          if (imgElement && !imgElement.src.startsWith(window.location.origin)) {
            const originalSrc = imgElement.src;
            // 백엔드 프록시 API 주소로 변경합니다.
            imgElement.src = `${API_BASE_URL}/proxy/image?url=${encodeURIComponent(originalSrc)}`;
            observer.disconnect(); // URL을 한 번 교체한 후에는 관찰을 중지합니다.
          }
        }
      }
    });

    observer.observe(mapContainerRef.current, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [props.marker]); // 마커가 변경되면(다른 날짜의 지도가 렌더링되면) useEffect를 다시 실행합니다.

  return (
    <div ref={mapContainerRef} className="mb-6 border rounded-lg overflow-hidden">
      <StaticMap {...props} />
    </div>
  );
};

export const PdfDocument = React.forwardRef<HTMLDivElement, PdfDocumentProps>(
  ({ workspaceName, itinerary, dayLayers }, ref) => {
    return (
      // PDF로 변환할 전체 영역입니다.
      <div
        ref={ref}
        className="p-8 bg-white" // Tailwind 클래스로 복원
        style={{ width: '210mm', minHeight: '297mm' }}
      >
        <h1 className="text-3xl font-bold mb-8 border-b pb-4">
          {workspaceName} 여행 계획
        </h1>

        {dayLayers.map((day, dayIndex) => {
          const poisForDay = itinerary[day.id] || [];
          if (poisForDay.length === 0) return null;

          const { center, level } = getMapBounds(poisForDay);

          return (
            <div key={day.id} className="mb-10" style={{ breakInside: 'avoid' }}>
              <h2
                className="text-2xl font-semibold mb-4"
                style={{ color: day.color }}
              >
                Day {dayIndex + 1} - {day.label}
              </h2>

              {/* 지도 이미지 */}
              <PdfMapImage
                center={center}
                level={level}
                style={{ width: '100%', height: '400px' }}
                marker={poisForDay.map((poi, index) => ({
                  position: { lat: poi.latitude, lng: poi.longitude },
                  text: `${index + 1}`, // 마커에 순번만 표시 (텍스트가 길어지면 잘릴 수 있음)
                }))}
              />

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
