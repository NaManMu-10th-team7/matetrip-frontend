import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const PoiSocketEvent = {
  JOIN: 'join',
  JOINED: 'joined',
  SYNC: 'sync',
  LEAVE: 'leave',
  LEFT: 'left',
  MARK: 'mark',
  MARKED: 'marked',
  UNMARK: 'unmark',
  UNMARKED: 'unmarked',
  REORDER: 'reorder',
  ADD_SCHEDULE: 'addSchedule',
  REMOVE_SCHEDULE: 'removeSchedule',
} as const;

export type Poi = {
  id: string;
  workspaceId: string;
  createdBy: string;
  latitude: number;
  longitude: number;
  address: string;
  placeName?: string;
  planDayId?: string;
  categoryName?: string;
  status: 'MARKED' | 'UNMARKED' | 'SCHEDULED';
  sequence: number;
  isPersisted: boolean;
};

export type CreatePoiDto = {
  workspaceId: string;
  createdBy: string;
  longitude: number;
  latitude: number;
  address:string;
  placeName?: string;
  planDayId?: string;
  categoryName?: string;
};

export function usePoiSocket(workspaceId: string) {
  const socketRef = useRef<Socket | null>(null);
  const [pois, setPois] = useState<Poi[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const socket = io('http://localhost:3003/poi', {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    const handleSync = (payload: { pois: Poi[] }) => {
      console.log('[Event] SYNC 수신:', payload);
      setPois(payload.pois || []);
      setIsSyncing(false);
    };

    const handleMarked = (newPoi: Poi) => {
      console.log('[Event] MARKED 수신:', newPoi);
      if (newPoi && newPoi.id) {
        setPois((prevPois) => {
          // Ensure the new POI has a status, defaulting to 'MARKED' if not provided
          const poiWithStatus = { ...newPoi, status: newPoi.status || 'MARKED' };
          if (prevPois.some((p) => p.id === poiWithStatus.id)) {
            return prevPois.map((p) => p.id === poiWithStatus.id ? poiWithStatus : p);
          }
          return [...prevPois, poiWithStatus];
        });
      }
    };

    const handleUnmarked = (data: { poiId: string | number }) => {
      console.log('[Event] UNMARKED 수신:', data);
      if (data && data.poiId) {
        setPois((prevPois) => prevPois.filter((p) => p.id !== data.poiId));
      }
    };

    const handleAddSchedule = (data: { poiId: string; planDayId: string }) => {
        console.log('[Event] ADD_SCHEDULE 수신:', data);
        setPois((prevPois) =>
          prevPois.map((p) =>
            p.id === data.poiId
              ? { ...p, planDayId: data.planDayId, status: 'SCHEDULED' }
              : p
          )
        );
    };

    const handleRemoveSchedule = (data: { poiId: string; planDayId: string }) => {
        console.log('[Event] REMOVE_SCHEDULE 수신:', data);
        setPois((prevPois) =>
          prevPois.map((p) =>
            p.id === data.poiId
              ? { ...p, planDayId: undefined, status: 'MARKED' }
              : p
          )
        );
    };

    const handleReorder = (data: { planDayId: string; poiIds: string[] }) => {
        console.log('[Event] REORDER 수신:', data);
        const newSequenceMap = new Map(data.poiIds.map((id, index) => [id, index]));
        setPois((prevPois) =>
          prevPois.map((poi) => {
            if (poi.planDayId === data.planDayId && newSequenceMap.has(poi.id)) {
              return { ...poi, sequence: newSequenceMap.get(poi.id)! };
            }
            return poi;
          })
        );
    };

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit(PoiSocketEvent.JOIN, { workspaceId });
    });

    socket.on(PoiSocketEvent.SYNC, handleSync);
    socket.on(PoiSocketEvent.MARKED, handleMarked);
    socket.on(PoiSocketEvent.UNMARKED, handleUnmarked);
    socket.on(PoiSocketEvent.ADD_SCHEDULE, handleAddSchedule);
    socket.on(PoiSocketEvent.REMOVE_SCHEDULE, handleRemoveSchedule);
    socket.on(PoiSocketEvent.REORDER, handleReorder);

    return () => {
      console.log('Disconnecting socket...');
      socket.emit(PoiSocketEvent.LEAVE, { workspaceId });
      socket.off(PoiSocketEvent.SYNC, handleSync);
      socket.off(PoiSocketEvent.MARKED, handleMarked);
      socket.off(PoiSocketEvent.UNMARKED, handleUnmarked);
      socket.off(PoiSocketEvent.ADD_SCHEDULE, handleAddSchedule);
      socket.off(PoiSocketEvent.REMOVE_SCHEDULE, handleRemoveSchedule);
      socket.off(PoiSocketEvent.REORDER, handleReorder);
      socket.disconnect();
    };
  }, [workspaceId]);

  const markPoi = useCallback((poiData: Omit<CreatePoiDto, 'workspaceId' | 'createdBy' | 'id'>) => {
    if (!user?.userId) {
      console.error('인증된 사용자 정보가 없습니다.');
      return;
    }
    const payload = { ...poiData, workspaceId, createdBy: user.userId };
    socketRef.current?.emit(PoiSocketEvent.MARK, payload, (response: any) => {
      console.log('[Ack] MARK 응답:', response);
    });
  }, [workspaceId, user?.userId]);

  const unmarkPoi = useCallback((poiId: number | string) => {
    socketRef.current?.emit(PoiSocketEvent.UNMARK, { workspaceId, poiId });
  }, [workspaceId]);

  const addSchedule = useCallback((poiId: string, planDayId: string) => {
    socketRef.current?.emit(PoiSocketEvent.ADD_SCHEDULE, { workspaceId, poiId, planDayId });
  }, [workspaceId]);

  const removeSchedule = useCallback((poiId: string, planDayId: string) => {
    socketRef.current?.emit(PoiSocketEvent.REMOVE_SCHEDULE, { workspaceId, poiId, planDayId });
  }, [workspaceId]);

  const reorderPois = useCallback((planDayId: string, poiIds: string[]) => {
    socketRef.current?.emit(PoiSocketEvent.REORDER, { workspaceId, planDayId, poiIds });
  }, [workspaceId]);

  return { pois, setPois, isSyncing, markPoi, unmarkPoi, addSchedule, removeSchedule, reorderPois };
}
