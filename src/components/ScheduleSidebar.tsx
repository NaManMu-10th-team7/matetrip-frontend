import React, { useState, useMemo } from 'react';
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  MapPin,
  X,
  Clock,
  Car,
  ArrowLeftToLine,
  ArrowRightToLine,
  Trash2, // Import Trash2 icon
} from 'lucide-react';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Poi } from '../hooks/usePoiSocket';
import type { DayLayer, RouteSegment } from '../types/map';
import { Button } from './ui/button';
import { SimpleToggle } from './ui/SimpleToggle';
import { CategoryIcon } from './CategoryIcon';
import type { AiPlace } from '../hooks/useChatSocket';
import { usePlaceStore } from '../store/placeStore';

interface PoiItemProps {
  poi: Poi & { image_url?: string };
  color?: string;
  index?: number;
  onPoiClick: (poi: Poi | AiPlace) => void;
  onPoiHover: (poiId: string | null) => void;
  unmarkPoi: (poiId: string | number) => void;
  removeSchedule: (poiId: string, planDayId: string) => void;
  isHovered: boolean;
}

function PoiItem({
  poi,
  color,
  index,
  onPoiClick,
  onPoiHover,
  unmarkPoi,
  removeSchedule,
  isHovered,
}: PoiItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: poi.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0 : 1,
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (poi.status === 'SCHEDULED' && poi.planDayId) {
      removeSchedule(poi.id, poi.planDayId);
    } else {
      unmarkPoi(poi.id);
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center text-sm p-2 rounded-md cursor-pointer border border-gray-200 ${
        // 테두리 추가
        isHovered ? 'bg-blue-100' : 'hover:bg-gray-100'
      }`}
      onClick={() => onPoiClick(poi)}
      onMouseEnter={() => onPoiHover(poi.id)}
      onMouseLeave={() => onPoiHover(null)}
    >
      {/* 드래그앤드롭 아이콘 */}
      <div
        {...attributes}
        {...listeners}
        className="touch-none p-1 cursor-grab flex-shrink-0"
      >
        <GripVertical className="w-6 h-6 text-gray-400" />
      </div>

      {/* 장소 이미지 또는 카테고리 아이콘 */}
      {poi.image_url ? (
        <img
          src={poi.image_url}
          alt={poi.placeName}
          className="w-12 h-12 rounded-md object-cover ml-2 mr-3 flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-md bg-gray-200 flex items-center justify-center ml-2 mr-3 flex-shrink-0">
          <CategoryIcon
            category={poi.categoryName}
            className="w-6 h-6 text-gray-500"
          />
        </div>
      )}

      <div className="flex items-center flex-grow min-w-0">
        {color && index !== undefined && (
          <span
            className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-white text-sm mr-2"
            style={{ backgroundColor: color }}
          >
            {index + 1}
          </span>
        )}
        <span className="truncate font-medium">{poi.placeName}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDeleteClick}
        className="w-8 h-8 p-0 flex-shrink-0"
      >
        <Trash2 className="w-4 h-4 text-gray-500" />
      </Button>
    </li>
  );
}

function MarkerStorage({
  pois,
  onPoiClick,
  onPoiHover,
  unmarkPoi,
  removeSchedule,
  hoveredPoiId,
}: {
  pois: (Poi & { image_url?: string })[];
  onPoiClick: (poi: Poi | AiPlace) => void;
  onPoiHover: (poiId: string | null) => void;
  unmarkPoi: (poiId: string | number) => void;
  removeSchedule: (poiId: string, planDayId: string) => void;
  hoveredPoiId: string | null;
}) {
  const { setNodeRef } = useDroppable({ id: 'marker-storage' });
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div ref={setNodeRef} className="px-6 py-4 border rounded-lg bg-slate-50">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-bold">장소 보관함</h3>
        </div>
        <Button
          variant="ghost"
          className="size-[28px]"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronDown className="size-[28px]" />
          ) : (
            <ChevronUp className="size-[28px]" />
          )}
        </Button>
      </div>
      {!isCollapsed && (
        <SortableContext
          id="marker-storage-sortable"
          items={pois.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-2 min-h-[2rem]">
            {pois.length > 0 ? (
              pois.map((poi) => (
                <PoiItem
                  key={poi.id}
                  poi={poi}
                  onPoiClick={onPoiClick}
                  onPoiHover={onPoiHover}
                  unmarkPoi={unmarkPoi}
                  removeSchedule={removeSchedule}
                  isHovered={hoveredPoiId === poi.id}
                />
              ))
            ) : (
              <p className="text-sm text-gray-500 p-2">
                지도에 장소를 추가하여 보관하세요.
              </p>
            )}
          </ul>
        </SortableContext>
      )}
    </div>
  );
}

function DayItineraryItem({
  layer,
  itinerary,
  visibleDayIds,
  routeSegmentsByDay,
  onDayVisibilityChange,
  onOptimizeRoute,
  onPoiClick,
  onPoiHover,
  unmarkPoi,
  removeSchedule,
  onToggleCollapse,
  isCollapsed,
  hoveredPoiId,
}: {
  layer: DayLayer;
  itinerary: Record<string, (Poi & { image_url?: string })[]>;
  visibleDayIds: Set<string>;
  routeSegmentsByDay: Record<string, RouteSegment[]>;
  onDayVisibilityChange: (dayId: string, isVisible: boolean) => void;
  onOptimizeRoute: (dayId: string) => void;
  onPoiClick: (poi: Poi | AiPlace) => void;
  onPoiHover: (poiId: string | null) => void;
  unmarkPoi: (poiId: string | number) => void;
  removeSchedule: (poiId: string, planDayId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  hoveredPoiId: string | null;
}) {
  const { setNodeRef } = useDroppable({ id: layer.id });

  const pois = itinerary[layer.id] || [];
  const isDayVisible = visibleDayIds.has(layer.id);
  const segmentsForThisDay = routeSegmentsByDay[layer.id] || [];
  const containerBodyClasses = `transition-opacity duration-300 ${
    isDayVisible ? 'opacity-100' : 'opacity-40 pointer-events-none'
  }`;

  return (
    <div className="border px-6 py-4 rounded-lg bg-slate-50">
      <div
        ref={setNodeRef}
        className="flex items-center justify-between gap-2 "
      >
        {/* 왼쪽 영역: 접기/펴기 버튼과 날짜 라벨 */}
        <div className="flex items-center gap-2 flex-shrink min-w-0 ">
          <Button
            variant="ghost"
            className="size-[28px]"
            onClick={onToggleCollapse}
          >
            {isCollapsed ? (
              <ChevronDown className="size-[28px]" />
            ) : (
              <ChevronUp className="size-[28px]" />
            )}
          </Button>
          <h3 className="text-base font-bold truncate">{layer.label}</h3>
          <SimpleToggle
            checked={isDayVisible}
            onChange={(checked) => onDayVisibilityChange(layer.id, checked)}
          />
        </div>
        {/* 오른쪽 영역: 경로 최적화 버튼과 날짜 가시성 토글 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {pois.length >= 2 && (
            <Button
              variant="outline"
              className="text-sm rounded-full hover:bg-transparent hover:border-2 hover:border-black"
              onClick={() => onOptimizeRoute(layer.id)}
            >
              경로 최적화
            </Button>
          )}
        </div>
      </div>

      <div className={`mt-6 ${containerBodyClasses}`}>
        {!isCollapsed && (
          <SortableContext
            id={`${layer.id}-sortable`}
            items={pois.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2 min-h-[2rem]">
              {pois.length > 0 ? (
                pois.map((poi, index) => (
                  <React.Fragment key={poi.id}>
                    <PoiItem
                      poi={poi}
                      color={layer.color}
                      index={index}
                      onPoiClick={onPoiClick}
                      onPoiHover={onPoiHover}
                      unmarkPoi={unmarkPoi}
                      removeSchedule={removeSchedule}
                      isHovered={hoveredPoiId === poi.id}
                    />
                    {index < pois.length - 1 &&
                      (() => {
                        const nextPoi = pois[index + 1];
                        const segment = segmentsForThisDay.find(
                          (s) =>
                            s.fromPoiId === poi.id && s.toPoiId === nextPoi.id
                        );
                        if (!segment) return null;

                        const totalMinutes = Math.ceil(segment.duration / 60);
                        const totalKilometers = (
                          segment.distance / 1000
                        ).toFixed(1);

                        return (
                          <div className="relative flex items-center h-8 pl-8">
                            <div className="absolute left-4 w-0.5 h-full bg-gray-300" />
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="mr-2 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {`${totalMinutes}분`}
                              </span>
                              <span className="flex items-center">
                                <Car className="w-3 h-3 mr-1" />
                                {`${totalKilometers}km`}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                  </React.Fragment>
                ))
              ) : (
                <p className="text-sm text-gray-500 p-2">
                  장소를 보관함에서 드래그하여 추가하세요.
                </p>
              )}
            </ul>
          </SortableContext>
        )}
      </div>
    </div>
  );
}

interface ScheduleSidebarProps {
  position: 'hidden' | 'overlay' | 'docked';
  onClose: () => void;
  onDock: () => void;
  onUndock: () => void;
  itinerary: Record<string, Poi[]>;
  dayLayers: DayLayer[];
  markedPois: Poi[];
  unmarkPoi: (poiId: string | number) => void;
  removeSchedule: (poiId: string, planDayId: string) => void;
  onPoiClick: (poi: Poi | AiPlace) => void;
  onPoiHover: (poiId: string | null) => void;
  routeSegmentsByDay: Record<string, RouteSegment[]>;
  onOptimizeRoute: (dayId: string) => void;
  visibleDayIds: Set<string>;
  onDayVisibilityChange: (dayId: string, isVisible: boolean) => void;
  onMyItineraryVisibilityChange: () => void;
  hoveredPoiId: string | null;
  isOptimizationProcessing: boolean;
}

export function ScheduleSidebar({
  position,
  onClose,
  onDock,
  onUndock,
  itinerary,
  dayLayers,
  markedPois,
  unmarkPoi,
  removeSchedule,
  onPoiClick,
  onPoiHover,
  routeSegmentsByDay,
  onOptimizeRoute,
  visibleDayIds,
  onDayVisibilityChange,
  onMyItineraryVisibilityChange,
  hoveredPoiId,
}: ScheduleSidebarProps) {
  const [collapsedDayIds, setCollapsedDayIds] = useState<Set<string>>(
    new Set()
  );

  const placeCache = usePlaceStore((state) => state.placesById);

  const poisWithEnhancedData = useMemo(() => {
    const allPois = [...markedPois, ...Object.values(itinerary).flat()];
    return allPois.map((poi) => {
      const cachedPlace = placeCache.get(poi.placeId);
      if (cachedPlace) {
        return {
          ...poi,
          categoryName: poi.categoryName || cachedPlace.category,
          image_url: cachedPlace.image_url,
        };
      }
      return poi;
    });
  }, [markedPois, itinerary, placeCache]);

  const enrichedMarkedPois = useMemo(
    () =>
      poisWithEnhancedData
        .filter((p) => p.status === 'MARKED')
        .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)),
    [poisWithEnhancedData]
  );

  const enrichedItinerary = useMemo(() => {
    const newItinerary: Record<string, (Poi & { image_url?: string })[]> = {};
    dayLayers.forEach((layer) => {
      newItinerary[layer.id] = poisWithEnhancedData
        .filter((p) => p.planDayId === layer.id && p.status === 'SCHEDULED')
        .sort((a, b) => a.sequence - b.sequence);
    });
    return newItinerary;
  }, [poisWithEnhancedData, dayLayers]);

  const handleToggleDayCollapse = (dayId: string) => {
    setCollapsedDayIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayId)) {
        newSet.delete(dayId);
      } else {
        newSet.add(dayId);
      }
      return newSet;
    });
  };

  const handleToggleAllCollapse = () => {
    if (collapsedDayIds.size === dayLayers.length) {
      setCollapsedDayIds(new Set());
    } else {
      setCollapsedDayIds(new Set(dayLayers.map((l) => l.id)));
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'docked':
        return 'left-0';
      case 'overlay':
        return 'left-1/2';
      case 'hidden':
      default:
        return 'left-full';
    }
  };

  return (
    <div
      className={`absolute top-0 h-full w-1/2 bg-white border-l border-gray-200 shadow-lg transition-all duration-300 ease-in-out z-20 rounded-lg overflow-hidden ${getPositionClasses()}`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-10 py-4 border-b">
          <div className="flex items-center gap-2">
            {position === 'overlay' ? (
              <Button variant="ghost" size="icon" onClick={onDock}>
                <ArrowLeftToLine className="w-5 h-5" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={onUndock}>
                <ArrowRightToLine className="w-5 h-5" />
              </Button>
            )}
            <h2 className="text-xl font-bold">여행 일정</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-10 py-4 space-y-4">
          <MarkerStorage
            pois={enrichedMarkedPois}
            onPoiClick={onPoiClick}
            onPoiHover={onPoiHover}
            unmarkPoi={unmarkPoi}
            removeSchedule={removeSchedule}
            hoveredPoiId={hoveredPoiId}
          />
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-0 py-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">전체 경로</h3>
                <SimpleToggle
                  checked={dayLayers.every((layer) =>
                    visibleDayIds.has(layer.id)
                  )}
                  onChange={onMyItineraryVisibilityChange}
                />
              </div>
              <Button
                variant="link"
                className="text-base text-gray-500 p-0 h-auto"
                onClick={handleToggleAllCollapse}
              >
                <ChevronsUpDown className="size-[28px] mr-1" />
                {collapsedDayIds.size === dayLayers.length
                  ? '일정 모두 펴기'
                  : '일정 모두 접기'}
              </Button>
            </div>
            <div className="pt-4 space-y-4">
              {dayLayers.map((layer) => (
                <DayItineraryItem
                  key={layer.id}
                  layer={layer}
                  itinerary={enrichedItinerary}
                  visibleDayIds={visibleDayIds}
                  routeSegmentsByDay={routeSegmentsByDay}
                  onDayVisibilityChange={onDayVisibilityChange}
                  onOptimizeRoute={onOptimizeRoute}
                  onPoiClick={onPoiClick}
                  onPoiHover={onPoiHover}
                  unmarkPoi={unmarkPoi}
                  removeSchedule={removeSchedule}
                  isCollapsed={collapsedDayIds.has(layer.id)}
                  onToggleCollapse={() => handleToggleDayCollapse(layer.id)}
                  hoveredPoiId={hoveredPoiId}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
