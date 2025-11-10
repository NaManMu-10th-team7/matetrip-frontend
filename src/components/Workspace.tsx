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
  { id: 2, name: '바다조아', isAuthor: false, avatar: 'https://images.unsplash.com/photo-1557053910-d9eadeed1c58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHx3b21hbiUyMHBvcnRyYWl0fGVuMHx8fDE3NjI1ODc0MzN8MHw&ixlib=rb-4.1.0&q=80&w=1080' },
  { id: 3, name: '제주사랑', isAuthor: false, avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjI1NTU3MDJ8MA&ixlib=rb-4.1.0&q=80&w=1080' },
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
    console.log('handleDragEnd called.');
    setActivePoi(null);
    const { active, over } = event;
    
    if (!over) {
      console.log('Drag ended outside of any droppable area.');
      return;
    }

    const activeId = String(active.id);
    const activeSortableContainerId = active.data.current?.sortable?.containerId; // 드래그 시작된 SortableContext의 ID

    let targetDroppableId: string | undefined; // 최종적으로 마커가 드롭된 Droppable 컨테이너의 ID
    let targetSortableContainerId: string | undefined; // 최종적으로 마커가 드롭된 SortableContext의 ID (아이템 위일 경우)

    if (over.data.current?.sortable) {
        // 드롭된 대상이 Sortable 아이템인 경우 (예: 이미 일정에 있는 다른 마커 위)
        targetSortableContainerId = String(over.data.current.sortable.containerId);
        // Sortable 아이템이 속한 Droppable 컨테이너의 ID를 유추
        targetDroppableId = targetSortableContainerId.replace('-sortable', '');
    } else {
        // 드롭된 대상이 Droppable 컨테이너인 경우 (예: 비어있는 날짜 컨테이너 또는 마커 보관함)
        targetDroppableId = String(over.id);
        // 이 경우 SortableContext ID는 Droppable ID에 '-sortable'을 붙인 형태일 수 있음
        targetSortableContainerId = targetDroppableId === 'marker-storage' ? 'marker-storage-sortable' : targetDroppableId + '-sortable';
    }

    console.log(`Drag event: activeId=${activeId}, overId=${over.id}, activeSortableContainerId=${activeSortableContainerId}, targetDroppableId=${targetDroppableId}, targetSortableContainerId=${targetSortableContainerId}`);

    if (!activeSortableContainerId || !activeId || !targetDroppableId) {
      console.log('Missing activeSortableContainerId, activeId, or targetDroppableId information.');
      return;
    }

    // 드래그 시작된 컨테이너와 드롭된 컨테이너가 같은 논리적 컨테이너인 경우 (내부에서 순서 변경)
    const isSameLogicalContainer = activeSortableContainerId === targetSortableContainerId;

    if (isSameLogicalContainer) {
      console.log(`Reordering within container: ${targetDroppableId}`);
      if (targetDroppableId === 'marker-storage') {
        const items = markedPois;
        const oldIndex = items.findIndex((item) => item.id === activeId);
        const newIndex = items.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const newItems = arrayMove(items, oldIndex, newIndex);
            setPois(currentPois => {
                const otherPois = currentPois.filter(p => p.status !== 'MARKED');
                const updatedContainerPois = newItems.map((poi, index) => ({ ...poi, status: 'MARKED', planDayId: undefined, sequence: index }));
                return [...otherPois, ...updatedContainerPois];
            });
        }
      } else { // 여행 일정 날짜 컨테이너
        const dayId = targetDroppableId;
        const items = itinerary[dayId];
        if (!items) return;
        const oldIndex = items.findIndex((item) => item.id === activeId);
        const newIndex = items.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const newItems = arrayMove(items, oldIndex, newIndex);
            const newPoiIds = newItems.map(poi => poi.id);
            setPois(currentPois => {
                const otherPois = currentPois.filter(p => p.planDayId !== dayId);
                const updatedContainerPois = newItems.map((poi, index) => ({ ...poi, sequence: index }));
                return [...otherPois, ...updatedContainerPois];
            });
            reorderPois(dayId, newPoiIds);
        }
      }
    } else { // 컨테이너 간 이동 (마커 보관함 <-> 여행 일정)
      console.log(`Moving POI between containers: from ${activeSortableContainerId} to ${targetDroppableId}`);
      const activePoi = pois.find(p => p.id === activeId);
      if (!activePoi) {
        console.log(`Active POI with ID ${activeId} not found.`);
        return;
      }
      
      const isDroppingToMarkerStorage = targetDroppableId === 'marker-storage';
      const isDroppingToItineraryDay = dayLayers.some(layer => layer.id === targetDroppableId);

      setPois(currentPois => {
        return currentPois.map(p => {
          if (p.id === activeId) {
            if (isDroppingToMarkerStorage) {
              return { ...p, status: 'MARKED', planDayId: undefined, sequence: 0 };
            } else if (isDroppingToItineraryDay) {
              const dayId = targetDroppableId;
              return { ...p, status: 'SCHEDULED', planDayId: dayId, sequence: 999 };
            }
          }
          return p;
        });
      });

      if (activePoi.planDayId) {
        console.log(`Removing POI ${activeId} from previous schedule day ${activePoi.planDayId}`);
        removeSchedule(activeId, activePoi.planDayId);
      }

      if (isDroppingToItineraryDay) {
        const dayId = targetDroppableId;
        console.log(`ADD_SCHEDULE event: Adding POI ${activeId} to schedule day ${dayId}`);
        addSchedule(activeId, dayId);
      } else if (isDroppingToMarkerStorage) {
        console.log(`POI ${activeId} moved to marker-storage. No ADD_SCHEDULE event.`);
      }
    }
  }, [markedPois, itinerary, pois, setPois, reorderPois, removeSchedule, addSchedule, dayLayers]);

  const handleMapPoiDragEnd = useCallback((poiId: string, lat: number, lng: number) => {
    setPois(currentPois =>
      currentPois.map(poi =>
        poi.id === poiId ? { ...poi, latitude: lat, longitude: lng } : poi
      )
    );
    // TODO: Call a socket event to persist the new coordinates
    // For now, only local state is updated.
    console.log(`POI ${poiId} dragged to Lat: ${lat}, Lng: ${lng}`);
  }, [setPois]);

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
            removeSchedule={removeSchedule} // 이 줄을 추가합니다.
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
                  onPoiDragEnd={handleMapPoiDragEnd}
                  setSelectedPlace={setSelectedPlace} // Pass setSelectedPlace to MapPanel
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
