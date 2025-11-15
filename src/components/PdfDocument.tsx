import React, { useMemo, useEffect, useState } from 'react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';
import { Clock, Car } from 'lucide-react'; // 아이콘 import 추가
import type { Poi } from '../hooks/usePoiSocket';
import type { DayLayer, RouteSegment } from '../types/map';

interface PdfDocumentProps {
  workspaceName: string;
  itinerary: Record<string, Poi[]>;
  dayLayers: DayLayer[];
  routeSegmentsByDay: Record<string, RouteSegment[]>; // prop 타입 추가
}

/**
 * 숫자 텍스트를 포함하는 원형 마커 이미지를 데이터 URI로 생성합니다.
 * @param text - 마커에 표시할 숫자 텍스트
 * @returns 생성된 이미지의 데이터 URI
 */
const createMarkerImageSrc = (text: string): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const size = 24; // 마커 원의 지름
  const fontSize = 12; // 폰트 크기

  canvas.width = size;
  canvas.height = size;

  // 원 그리기
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI, false);
  ctx.fillStyle = '#F87171'; // Tailwind's red-400
  ctx.fill();
  ctx.lineWidth = 2; // 테두리를 더 잘 보이게 조정
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();

  // 텍스트 그리기
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2 + 1); // 텍스트 수직 정렬 미세 조정

  return canvas.toDataURL('image/png');
};

/**
 * 인터랙티브 Map을 사용하여 PDF용 지도 이미지를 렌더링하는 컴포넌트
 */
const PdfInteractiveMap = ({ pois }: { pois: Poi[] }) => {
  const [map, setMap] = useState<kakao.maps.Map>();

  useEffect(() => {
    if (!map || pois.length === 0) return;

    // [핵심 수정] 렌더링이 안정화될 시간을 준 후, 로직을 실행합니다.
    const timer = setTimeout(() => {
      // 1. 지도가 컨테이너의 정확한 크기를 다시 계산하도록 합니다.
      map.relayout();

      // 2. 정확해진 크기를 기준으로 모든 마커가 보이도록 경계를 설정합니다.
      const bounds = new window.kakao.maps.LatLngBounds();
      pois.forEach((poi) => {
        bounds.extend(
          new window.kakao.maps.LatLng(poi.latitude, poi.longitude)
        );
      });
      map.setBounds(bounds);
    }, 100); // 짧은 지연 시간으로 안정성 확보

    return () => clearTimeout(timer);
  }, [map, pois]);

  // 각 POI에 대한 마커 이미지를 미리 생성합니다.
  const markerImages = useMemo(() => {
    return pois.map((_, index) => createMarkerImageSrc(String(index + 1)));
  }, [pois]);

  return (
    <div
      className="mb-6 border rounded-lg overflow-hidden"
      style={{ width: '100%', height: '400px' }}
    >
      <Map
        center={{ lat: 37.5665, lng: 126.978 }} // 초기 중심점 (setBounds에 의해 덮어쓰여짐)
        style={{ width: '100%', height: '100%' }}
        // PDF 출력을 위해 모든 상호작용 비활성화
        isPanto={false}
        draggable={false}
        scrollwheel={false}
        zoomable={false}
        keyboardShortcuts={false}
        // Map 인스턴스를 state에 저장하여 useEffect에서 사용할 수 있도록 합니다.
        onCreate={setMap}
      >
        {pois.map((poi, index) => (
          <MapMarker
            key={poi.id}
            position={{ lat: poi.latitude, lng: poi.longitude }}
            // 미리 생성된 데이터 URI를 마커 이미지로 사용합니다.
            image={{
              src: markerImages[index],
              size: { width: 24, height: 24 },
            }}
          />
        ))}
      </Map>
    </div>
  );
};

export const PdfDocument = React.forwardRef<HTMLDivElement, PdfDocumentProps>(
  ({ workspaceName, itinerary, dayLayers, routeSegmentsByDay }, ref) => {
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
          const segmentsForDay = routeSegmentsByDay[day.id] || []; // 해당 날짜의 경로 정보 가져오기
          if (poisForDay.length === 0) return null;

          return (
            <div
              key={day.id}
              className="mb-10"
              style={{ breakInside: 'avoid' }}
            >
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
                  <React.Fragment key={poi.id}>
                    <li className="flex items-start">
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
                    {/* 마지막 장소가 아닐 경우, 다음 장소까지의 경로 정보 표시 */}
                    {index < poisForDay.length - 1 &&
                      (() => {
                        const nextPoi = poisForDay[index + 1];
                        const segment = segmentsForDay.find(
                          (s) =>
                            s.fromPoiId === poi.id && s.toPoiId === nextPoi.id
                        );
                        if (!segment) return null;

                        const totalMinutes = Math.ceil(segment.duration / 60);
                        const totalKilometers = (
                          segment.distance / 1000
                        ).toFixed(1);

                        return (
                          <li className="flex items-center pl-10 text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            <span className="mr-4">{`${totalMinutes}분`}</span>
                            <Car className="w-3 h-3 mr-1" />
                            <span>{`${totalKilometers}km`}</span>
                          </li>
                        );
                      })()}
                  </React.Fragment>
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
