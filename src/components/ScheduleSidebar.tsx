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
  poi: Poi;
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
      className={`flex items-center text-sm p-1 rounded-md cursor-pointer ${
        isHovered ? 'bg-blue-100' : 'hover:bg-gray-100'
      }`}
      onClick={() => onPoiClick(poi)}
      onMouseEnter={() => onPoiHover(poi.id)}
      onMouseLeave={() => onPoiHover(null)}
    >
      <div className="flex items-center w-12 flex-shrink-0 gap-1">
        <div
          {...attributes}
          {...listeners}
          className="touch-none p-1 cursor-grab"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        {color && index !== undefined && (
          <span
            className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-white text-sm"
            style={{ backgroundColor: color }}
          >
            {index + 1}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-grow ml-2 min-w-0">
        <CategoryIcon
          category={poi.categoryName}
          className="w-4 h-4 text-gray-500 flex-shrink-0"
        />
        <span className="truncate">{poi.placeName}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDeleteClick}
        className="w-6 h-6 p-0 flex-shrink-0"
      >
        <X className="w-3 h-3 text-gray-500" />
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
  pois: Poi[];
  onPoiClick: (poi: Poi | AiPlace) => void;
  onPoiHover: (poiId: string | null) => void;
  unmarkPoi: (poiId: string | number) => void;
  removeSchedule: (poiId: string, planDayId: string) => void;
  hoveredPoiId: string | null;
}) {
  const { setNodeRef } = useDroppable({ id: 'marker-storage' });
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div ref={setNodeRef} className="p-3 border-b">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-bold">장소 보관함</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
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
  itinerary: Record<string, Poi[]>;
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
    <div className="border-b pb-2 px-3">
      <div
        ref={setNodeRef}
        className="flex items-center justify-between gap-2 "
      >
        <div className="flex items-center gap-2 flex-shrink min-w-0 ">
          <SimpleToggle
            checked={isDayVisible}
            onChange={(checked) => onDayVisibilityChange(layer.id, checked)}
          />
          <h3 className="text-base font-bold truncate">{layer.label}</h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {pois.length >= 2 && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-sm "
              onClick={() => onOptimizeRoute(layer.id)}
            >
              경로 최적화
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 "
            onClick={onToggleCollapse}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className={`mt-2 ${containerBodyClasses}`}>
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
  isOpen: boolean;
  onClose: () => void;
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
  isOpen,
  onClose,
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

  const poisWithCategory = useMemo(() => {
    const allPois = [...markedPois, ...Object.values(itinerary).flat()];
    return allPois.map((poi) => {
      if (poi.categoryName) return poi;
      const cachedPlace = placeCache.get(poi.placeId);
      return cachedPlace ? { ...poi, categoryName: cachedPlace.category } : poi;
    });
  }, [markedPois, itinerary, placeCache]);

  const enrichedMarkedPois = useMemo(
    () =>
      poisWithCategory
        .filter((p) => p.status === 'MARKED')
        .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)),
    [poisWithCategory]
  );

  const enrichedItinerary = useMemo(() => {
    const newItinerary: Record<string, Poi[]> = {};
    dayLayers.forEach((layer) => {
      newItinerary[layer.id] = poisWithCategory
        .filter((p) => p.planDayId === layer.id && p.status === 'SCHEDULED')
        .sort((a, b) => a.sequence - b.sequence);
    });
    return newItinerary;
  }, [poisWithCategory, dayLayers]);

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

  return (
    <div
      className={`absolute top-0 right-0 h-full w-1/2 bg-white border-l border-gray-200 shadow-lg transition-transform duration-300 ease-in-out z-20 rounded-lg overflow-hidden ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold">내 일정</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <MarkerStorage
            pois={enrichedMarkedPois}
            onPoiClick={onPoiClick}
            onPoiHover={onPoiHover}
            unmarkPoi={unmarkPoi}
            removeSchedule={removeSchedule}
            hoveredPoiId={hoveredPoiId}
          />
          <div className="p-3 space-y-3 flex flex-col">
            <div className="flex items-center justify-between p-2 border-b">
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
                size="sm"
                className="text-base text-gray-500"
                onClick={handleToggleAllCollapse}
              >
                <ChevronsUpDown className="w-3.5 h-3.5 mr-1" />
                {collapsedDayIds.size === dayLayers.length
                  ? '일정 모두 펴기'
                  : '일정 모두 접기'}
              </Button>
            </div>
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
  );
}
