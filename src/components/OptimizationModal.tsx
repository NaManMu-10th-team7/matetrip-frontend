import type { Poi } from '../hooks/usePoiSocket';
import type { DayLayer, RouteSegment } from '../types/map';
import { Button } from './ui/button';
import React from 'react';
import { Clock, Car, X } from 'lucide-react';

const formatDuration = (seconds: number) => {
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}시간 ${remainingMinutes}분`;
};

const formatDistance = (meters: number) => {
  return `${(meters / 1000).toFixed(1)}km`;
};

const formatDurationChange = (seconds: number) => {
  const isNegative = seconds < 0;
  const prefix = isNegative ? '' : '+';
  const absSeconds = Math.abs(seconds);
  const minutes = Math.floor(absSeconds / 60);

  if (minutes === 0 && absSeconds > 0) {
    return seconds > 0 ? '+1분 미만' : '-1분 미만';
  }

  let formatted;
  if (minutes < 60) {
    formatted = `${minutes}분`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    formatted = `${hours}시간 ${remainingMinutes}분`;
  }
  if (seconds === 0) return '변동 없음';
  return `${prefix}${formatted}`;
};

const formatDistanceChange = (meters: number) => {
  const isNegative = meters < 0;
  const prefix = isNegative ? '' : '+';
  const absMeters = Math.abs(meters);
  const formatted = `${(absMeters / 1000).toFixed(1)}km`;
  if (meters === 0) return '변동 없음';
  return `${prefix}${formatted}`;
};

interface OptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalData: { pois: Poi[]; segments: RouteSegment[] } | null;
  optimizedData: { pois: Poi[]; segments: RouteSegment[] } | null;
  dayLayer: DayLayer | null;
}

export function OptimizationModal({
  isOpen,
  onClose,
  originalData,
  optimizedData,
  dayLayer,
}: OptimizationModalProps) {
  if (!isOpen || !originalData || !dayLayer) return null;

  const calculateTotals = (segments: RouteSegment[]) => {
    const totalDistance = segments.reduce((sum, s) => sum + s.distance, 0);
    const totalDuration = segments.reduce((sum, s) => sum + s.duration, 0);
    return { totalDistance, totalDuration };
  };

  const originalTotals = calculateTotals(originalData.segments);
  const optimizedTotals = optimizedData
    ? calculateTotals(optimizedData.segments)
    : null;

  const renderRouteList = (
    pois: Poi[],
    segments: RouteSegment[],
    color: string
  ) => (
    <ul className="space-y-1">
      {pois.map((poi, index) => (
        <React.Fragment key={poi.id}>
          <li className="flex items-center text-base">
            <span
              className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-white text-sm mr-3"
              style={{ backgroundColor: color }}
            >
              {index + 1}
            </span>
            <span className="truncate">{poi.placeName}</span>
          </li>
          {index < pois.length - 1 &&
            (() => {
              const nextPoi = pois[index + 1];
              if (!nextPoi) return null;
              const segment = segments.find(
                (s) => s.fromPoiId === poi.id && s.toPoiId === nextPoi.id
              );
              if (!segment) return null;
              return (
                <div className="relative flex h-8 items-center pl-8">
                  <div className="absolute left-2.5 h-full w-0.5 bg-gray-300" />
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDuration(segment.duration)}
                    </span>
                    <span className="flex items-center">
                      <Car className="h-3 w-3 mr-1" />
                      {formatDistance(segment.distance)}
                    </span>
                  </div>
                </div>
              );
            })()}
        </React.Fragment>
      ))}
    </ul>
  );

  return (
    <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">경로 최적화 결과</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 divide-x">
          <div className="p-4">
            <h3 className="font-semibold mb-3 text-center">기존 경로</h3>
            <div className="text-base mb-4 p-2 bg-gray-50 rounded-md">
              <p>
                <strong>총 거리:</strong>{' '}
                {formatDistance(originalTotals.totalDistance)}
              </p>
              <p>
                <strong>총 소요 시간:</strong>{' '}
                {formatDuration(originalTotals.totalDuration)}
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto pr-2">
              {renderRouteList(
                originalData.pois,
                originalData.segments,
                dayLayer.color
              )}
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-semibold mb-3 text-center">최적 경로</h3>
            {optimizedData && optimizedTotals ? (
              <>
                <div className="text-base mb-4 p-2 bg-blue-50 rounded-md">
                  <p>
                    <strong>총 거리:</strong>{' '}
                    {formatDistance(optimizedTotals.totalDistance)}
                    <span
                      className={`ml-2 text-sm font-semibold ${
                        optimizedTotals.totalDistance <
                        originalTotals.totalDistance
                          ? 'text-blue-600'
                          : optimizedTotals.totalDistance >
                              originalTotals.totalDistance
                            ? 'text-red-600'
                            : 'text-gray-500'
                      }`}
                    >
                      (
                      {formatDistanceChange(
                        optimizedTotals.totalDistance -
                          originalTotals.totalDistance
                      )}
                      )
                    </span>
                  </p>
                  <p>
                    <strong>총 소요 시간:</strong>{' '}
                    {formatDuration(optimizedTotals.totalDuration)}
                    <span
                      className={`ml-2 text-sm font-semibold ${
                        optimizedTotals.totalDuration <
                        originalTotals.totalDuration
                          ? 'text-blue-600'
                          : optimizedTotals.totalDuration >
                              originalTotals.totalDuration
                            ? 'text-red-600'
                            : 'text-gray-500'
                      }`}
                    >
                      (
                      {formatDurationChange(
                        optimizedTotals.totalDuration -
                          originalTotals.totalDuration
                      )}
                      )
                    </span>
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto pr-2">
                  {renderRouteList(
                    optimizedData.pois,
                    optimizedData.segments,
                    dayLayer.color
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
                <p className="mt-4 text-gray-600">최적화 중입니다...</p>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t text-right">
          <Button onClick={onClose}>닫기</Button>
        </div>
      </div>
    </div>
  );
}
