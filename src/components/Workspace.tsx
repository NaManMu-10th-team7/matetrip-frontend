import { useState, useMemo, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { MapPanel, type KakaoPlace } from './MapPanel';
import type { PlanDayDto } from '../types/workspace';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { PlanRoomHeader } from './PlanRoomHeader';
import { type Poi, usePoiSocket } from '../hooks/usePoiSocket.ts';

interface WorkspaceProps {
  workspaceId: string;
  workspaceName: string;
  planDayDtos: PlanDayDto[];
  onEndTrip: () => void;
}

// ... (MOCK_MEMBERS, generateColorFromString는 이전과 동일)
const MOCK_MEMBERS = [
  { id: 1, name: '여행러버', isAuthor: true, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjI2MDg1MDN8MA&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 2, name: '바다조아', isAuthor: false, avatar: 'https://images.unsplash.com/photo-1557053910-d9eadeed1c58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHwzNzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MjU4NzQzM3ww&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 3, name: '제주사랑', isAuthor: false, avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjI1NTU3MDJ8MA&ixlib=rb-4.1.0&q=80&w=1080' },
];

const generateColorFromString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    const brightValue = Math.floor(value / 2) + 128;
    color += brightValue.toString(16).padStart(2, '0');
  }
  return color.toUpperCase();
};

function DraggablePoiItem({ poi }: { poi: Poi }) {
    return (
        <div className="flex items-center gap-2 text-xs p-1 rounded-md bg-white shadow-lg">
            <GripVertical className="w-4 h-4 text-gray-400" />
            <span className="truncate">{poi.placeName}</span>
        </div>
    );
}

export function Workspace({
  workspaceId,
  workspaceName,
  planDayDtos,
  onEndTrip,
}: WorkspaceProps) {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  
  const { pois, setPois, isSyncing, markPoi, unmarkPoi, addSchedule, removeSchedule, reorderPois } = usePoiSocket(workspaceId);
  
  const [selectedPlace, setSelectedPlace] = useState<KakaoPlace | null>(null);
  const [activePoi, setActivePoi] = useState<Poi | null>(null);
  const mapRef = useRef<kakao.maps.Map>(null);

  const dayLayers = useMemo(
    () =>
      planDayDtos.map((day) => ({
        id: day.id,
        label: day.planDate,
        color: generateColorFromString(day.id),
      })),
    [planDayDtos]
  );

  const { markedPois, itinerary } = useMemo(() => {
    const marked = pois
      .filter((p) => p.status === 'MARKED')
      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
    const itineraryData: Record<string, Poi[]> = {};
    dayLayers.forEach(layer => {
        itineraryData[layer.id] = pois
            .filter(p => p.planDayId === layer.id && p.status === 'SCHEDULED')
            .sort((a, b) => a.sequence - b.sequence);
    });
    return { markedPois: marked, itinerary: itineraryData };
  }, [pois, dayLayers]);

  const startDate = planDayDtos.length > 0 ? planDayDtos[0].planDate : '';
  const endDate = planDayDtos.length > 0 ? planDayDtos[planDayDtos.length - 1].planDate : '';

  const handlePoiClick = (poi: Poi) => {
    const map = mapRef.current;
    if (!map) return;
    const moveLatLon = new window.kakao.maps.LatLng(
      poi.latitude,
      poi.longitude
    );
    map.panTo(moveLatLon);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const poi = pois.find(p => p.id === active.id);
    if (poi) {
        setActivePoi(poi);
    }
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActivePoi(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeContainer = active.data.current?.sortable.containerId;
    const overContainer = over.data.current?.sortable.containerId;

    if (!activeContainer || !overContainer || !activeId) return;

    if (activeContainer === overContainer) {
      if (activeContainer === 'marker-storage') {
        const items = markedPois;
        const oldIndex = items.findIndex((item) => item.id === activeId);
        const newIndex = items.findIndex((item) => item.id === overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const newItems = arrayMove(items, oldIndex, newIndex);
            setPois(currentPois => {
                const otherPois = currentPois.filter(p => p.status !== 'MARKED');
                const updatedContainerPois = newItems.map((poi, index) => ({ ...poi, status: 'MARKED', planDayId: undefined, sequence: index }));
                return [...otherPois, ...updatedContainerPois];
            });
        }
      } else {
        const items = itinerary[activeContainer];
        if (!items) return;
        const oldIndex = items.findIndex((item) => item.id === activeId);
        const newIndex = items.findIndex((item) => item.id === overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const newItems = arrayMove(items, oldIndex, newIndex);
            const newPoiIds = newItems.map(poi => poi.id);
            setPois(currentPois => {
                const otherPois = currentPois.filter(p => p.planDayId !== activeContainer);
                const updatedContainerPois = newItems.map((poi, index) => ({ ...poi, sequence: index }));
                return [...otherPois, ...updatedContainerPois];
            });
            reorderPois(activeContainer, newPoiIds);
        }
      }
    } else {
      const activePoi = pois.find(p => p.id === activeId);
      if (!activePoi) return;
      setPois(currentPois => {
        return currentPois.map(p => {
          if (p.id === activeId) {
            if (overContainer === 'marker-storage') {
              return { ...p, status: 'MARKED', planDayId: undefined, sequence: 0 };
            }
            return { ...p, status: 'SCHEDULED', planDayId: overContainer, sequence: 999 };
          }
          return p;
        });
      });
      if (overContainer === 'marker-storage') {
        if (activePoi.planDayId) {
          removeSchedule(activeId, activePoi.planDayId);
        }
      } else {
        addSchedule(activeId, overContainer);
      }
    }
  }, [markedPois, itinerary, pois, setPois, reorderPois, removeSchedule, addSchedule]);

  return (
    <DndContext 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd} 
        collisionDetection={closestCenter}
    >
      <div className="h-[calc(100vh-4.5rem)] flex flex-col bg-gray-50">
        <PlanRoomHeader
          title={workspaceName}
          startDate={startDate}
          endDate={endDate}
          totalDays={planDayDtos.length}
          currentMembers={MOCK_MEMBERS.length}
          maxMembers={4}
          onExit={onEndTrip}
          onBack={onEndTrip}
          isOwner={true}
          activeMembers={MOCK_MEMBERS}
        />
        
        <div className="flex-1 flex overflow-y-auto relative">
          <LeftPanel 
            isOpen={isLeftPanelOpen} 
            itinerary={itinerary}
            dayLayers={dayLayers}
            markedPois={markedPois}
            unmarkPoi={unmarkPoi}
            onPlaceClick={setSelectedPlace}
            onPoiClick={handlePoiClick}
          />
          
          <button
            onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
            className="absolute top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-white hover:bg-gray-100 transition-colors flex items-center justify-center border border-gray-300 rounded-r-md shadow-md"
            style={{ left: isLeftPanelOpen ? '320px' : '0' }}
          >
            {isLeftPanelOpen ? <ChevronLeft className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4 text-gray-600" />}
          </button>
          
          <div className="flex-1 bg-gray-100">
              <MapPanel
                  itinerary={itinerary}
                  dayLayers={dayLayers}
                  pois={pois}
                  isSyncing={isSyncing}
                  markPoi={markPoi}
                  unmarkPoi={unmarkPoi}
                  selectedPlace={selectedPlace}
                  mapRef={mapRef}
              />
          </div>

          <button
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            className="absolute top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-white hover:bg-gray-100 transition-colors flex items-center justify-center border border-gray-300 rounded-l-md shadow-md"
            style={{ right: isRightPanelOpen ? '320px' : '0' }}
          >
            {isRightPanelOpen ? <ChevronRight className="w-4 h-4 text-gray-600" /> : <ChevronLeft className="w-4 h-4 text-gray-600" />}
          </button>

          <RightPanel 
            isOpen={isRightPanelOpen} 
          />
        </div>
      </div>
      <DragOverlay>
        {activePoi ? <DraggablePoiItem poi={activePoi} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
