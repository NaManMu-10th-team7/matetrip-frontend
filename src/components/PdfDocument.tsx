import React, { useMemo, useEffect, useState } from 'react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';
import { Clock, Car } from 'lucide-react';
import type { Poi } from '../hooks/usePoiSocket';
import type { DayLayer, RouteSegment } from '../types/map';
import { CategoryIcon } from './CategoryIcon';

interface PdfDocumentProps {
  workspaceName: string;
  day: DayLayer & { planDate: string };
  dayIndex: number;
  poisForPage: Poi[];
  allPoisForDay: Poi[];
  routeSegmentsForDay: RouteSegment[];
  showMap: boolean;
}

const createMarkerImageSrc = (text: string): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const size = 20;
  const fontSize = 10;

  canvas.width = size;
  canvas.height = size;

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI, false);
  ctx.fillStyle = '#F87171';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();

  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2 + 1);

  return canvas.toDataURL('image/png');
};

const PdfInteractiveMap = ({ pois }: { pois: Poi[] }) => {
  const [map, setMap] = useState<kakao.maps.Map>();

  useEffect(() => {
    if (!map || pois.length === 0) return;

    const timer = setTimeout(() => {
      map.relayout();
      const bounds = new window.kakao.maps.LatLngBounds();
      pois.forEach((poi) => {
        bounds.extend(
          new window.kakao.maps.LatLng(poi.latitude, poi.longitude)
        );
      });
      map.setBounds(bounds);
    }, 100);

    return () => clearTimeout(timer);
  }, [map, pois]);

  const markerImages = useMemo(() => {
    return pois.map((_, index) => createMarkerImageSrc(String(index + 1)));
  }, [pois]);

  return (
    <div
      className="border rounded-lg overflow-hidden"
      style={{
        width: '90%',
        height: '220px',
        margin: '0 auto 24px',
      }}
    >
      <Map
        center={{ lat: 37.5665, lng: 126.978 }}
        style={{ width: '100%', height: '100%' }}
        isPanto={false}
        draggable={false}
        scrollwheel={false}
        zoomable={false}
        keyboardShortcuts={false}
        onCreate={setMap}
      >
        {pois.map((poi, index) => (
          <MapMarker
            key={poi.id}
            position={{ lat: poi.latitude, lng: poi.longitude }}
            image={{
              src: markerImages[index],
              size: { width: 20, height: 20 },
            }}
          />
        ))}
      </Map>
    </div>
  );
};

export const PdfDocument = React.forwardRef<HTMLDivElement, PdfDocumentProps>(
  (
    {
      workspaceName,
      day,
      dayIndex,
      poisForPage,
      allPoisForDay,
      routeSegmentsForDay,
      showMap,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className="bg-white"
        style={{
          width: '210mm',
          height: '297mm',
          padding: '15mm',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h1 className="text-xl font-bold mb-6 border-b pb-3">
          {workspaceName} 여행 계획
        </h1>

        <div className="mb-8">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: day.color }}
          >
            {dayIndex + 1}일차 - {day.planDate}
          </h2>

          {showMap && <PdfInteractiveMap pois={allPoisForDay} />}

          <div style={{ width: '90%', margin: '0 auto' }}>
            <ul className="space-y-0">
              {poisForPage.map((poi) => {
                const overallIndex = allPoisForDay.findIndex(
                  (p) => p.id === poi.id
                );
                const isLastInDay = overallIndex === allPoisForDay.length - 1;
                const segment = !isLastInDay
                  ? routeSegmentsForDay.find(
                      (s) =>
                        s.fromPoiId === poi.id &&
                        s.toPoiId === allPoisForDay[overallIndex + 1].id
                    )
                  : null;

                return (
                  <li key={poi.id} className="flex relative">
                    {/* Timeline Column */}
                    <div className="flex flex-col items-center mr-4">
                      <div
                        className="relative z-10 flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-white text-base mt-0.5"
                        style={{ backgroundColor: day.color }}
                      >
                        {overallIndex + 1}
                      </div>
                      {!isLastInDay && (
                        <div className="w-0.5 flex-grow bg-gray-300" />
                      )}
                    </div>

                    {/* Content Column */}
                    <div className="w-full">
                      {/* Place Info */}
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-6">
                          {poi.imageUrl ? (
                            <img
                              src={poi.imageUrl}
                              alt={poi.placeName}
                              className="w-40 h-32 object-cover rounded-md"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <div className="w-40 h-32 rounded-md bg-gray-200 flex items-center justify-center">
                              <CategoryIcon
                                category={poi.categoryName}
                                className="w-12 h-12 text-gray-500"
                              />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-lg">{poi.placeName}</p>
                          {poi.categoryName && (
                            <p className="text-base text-gray-500 mt-1">
                              {poi.categoryName}
                            </p>
                          )}
                          {poi.address && (
                            <p className="text-base text-gray-600 mt-2">
                              {poi.address}
                            </p>
                          )}
                          {(poi as any).summary && (
                            <blockquote className="mt-2 pl-4 border-l-4 border-gray-300">
                              <p className="text-sm text-gray-700 italic">
                                {(poi as any).summary}
                              </p>
                            </blockquote>
                          )}
                        </div>
                      </div>

                      {/* Segment Info Spacer */}
                      {segment && (
                        <div className="h-24 flex items-center">
                          <div className="flex items-center text-base text-gray-500">
                            <Clock className="w-4 h-4 mr-2" />
                            <span className="mr-5">{`${Math.ceil(
                              segment.duration / 60
                            )}분`}</span>
                            <Car className="w-4 h-4 mr-2" />
                            <span>{`${(segment.distance / 1000).toFixed(
                              1
                            )}km`}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    );
  }
);

PdfDocument.displayName = 'PdfDocument';
