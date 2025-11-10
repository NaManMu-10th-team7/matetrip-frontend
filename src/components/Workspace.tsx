import { useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

export function Workspace({
  workspaceId,
  workspaceName,
  planDayDtos,
  onEndTrip,
}: WorkspaceProps) {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [itinerary, setItinerary] = useState<Record<string, Poi[]>>({});
  const { pois, isSyncing, markPoi, unmarkPoi, connections, connectPoi } = usePoiSocket(workspaceId);
  const [selectedPlace, setSelectedPlace] = useState<KakaoPlace | null>(null);
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

  return (
    <div className="h-[calc(100vh-4.5rem)] flex flex-col bg-gray-50">
      <PlanRoomHeader
        title={workspaceName}
        startDate={startDate}
        endDate={endDate}
        totalDays={planDayDtos.length}
        currentMembers={MOCK_MEMBERS.length}
        maxMembers={4} // Assuming a max of 4 for now
        onExit={onEndTrip}
        onBack={onEndTrip}
        isOwner={true} // Assuming the user is the owner
        activeMembers={MOCK_MEMBERS}
      />
      
      <div className="flex-1 flex overflow-y-auto relative">
        <LeftPanel 
          isOpen={isLeftPanelOpen} 
          itinerary={itinerary}
          dayLayers={dayLayers}
          unmarkPoi={unmarkPoi}
          onPlaceClick={setSelectedPlace}
          onPoiClick={handlePoiClick}
        />
        
        <button
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          className="absolute top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-white hover:bg-gray-100 transition-colors flex items-center justify-center border border-gray-300 rounded-r-md shadow-md"
          style={{ left: isLeftPanelOpen ? '320px' : '0' }}
        >
          {isLeftPanelOpen ? (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          )}
        </button>
        
        <div className="flex-1 bg-gray-100 flex items-center justify-center">
            <MapPanel
                itinerary={itinerary}
                setItinerary={setItinerary}
                dayLayers={dayLayers}
                pois={pois}
                isSyncing={isSyncing}
                markPoi={markPoi}
                unmarkPoi={unmarkPoi}
                connectPoi={connectPoi}
                selectedPlace={selectedPlace}
                connections={connections}
                onPoiClick={handlePoiClick}
                mapRef={mapRef}
            />
        </div>

        <button
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          className="absolute top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-white hover:bg-gray-100 transition-colors flex items-center justify-center border border-gray-300 rounded-l-md shadow-md"
          style={{ right: isRightPanelOpen ? '320px' : '0' }}
        >
          {isRightPanelOpen ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>

        <RightPanel 
          isOpen={isRightPanelOpen} 
        />
      </div>
    </div>
  );
}
