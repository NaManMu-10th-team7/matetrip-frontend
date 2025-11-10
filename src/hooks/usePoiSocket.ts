import { useEffect, useRef, useState } from 'react';
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
  status: 'MARKED' | 'UNMARKED';
  sequence: number;
  isPersisted: boolean;
};

export type CreatePoiDto = {
  workspaceId: string;
  createdBy: string;
  longitude: number;
  latitude: number;
  address: string;
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

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit(PoiSocketEvent.JOIN, { workspaceId });
    });

    socket.on(PoiSocketEvent.SYNC, (payload: { pois: Poi[] }) => {
      console.log('[Event] SYNC 수신:', payload);
      setPois(payload.pois || []);
      setIsSyncing(false);
    });

    socket.on(PoiSocketEvent.MARKED, (newPoi: Partial<Poi>) => {
      console.log('[Event] MARKED 수신:', newPoi);
      if (newPoi && newPoi.id) {
        // status 필드를 추가하여 완전한 Poi 객체로 만듭니다.
        const completedPoi: Poi = {
          ...newPoi,
          status: 'MARKED',
          workspaceId: newPoi.workspaceId || workspaceId,
          createdBy: newPoi.createdBy || '',
          sequence: newPoi.sequence || 0,
          isPersisted: newPoi.isPersisted || false,
        } as Poi;

        setPois((prevPois) => {
          if (prevPois.some((p) => p.id === completedPoi.id)) {
            return prevPois;
          }
          return [...prevPois, completedPoi];
        });
      }
    });

    socket.on(PoiSocketEvent.UNMARKED, (data: { poiId: string | number }) => {
      console.log('[Event] UNMARKED 수신:', data);
      if (data && data.poiId) {
        setPois((prevPois) => prevPois.filter((p) => p.id !== data.poiId));
      }
    });

    return () => {
      console.log('Disconnecting socket...');
      socket.emit(PoiSocketEvent.LEAVE, { workspaceId });
      socket.disconnect();
    };
  }, [workspaceId]);

  const markPoi = (
    poiData: Omit<CreatePoiDto, 'workspaceId' | 'createdBy' | 'id'>
  ) => {
    if (!user?.userId) {
      console.error('인증된 사용자 정보가 없습니다.');
      return;
    }
    const payload = { ...poiData, workspaceId, createdBy: user.userId };
    
    socketRef.current?.emit(PoiSocketEvent.MARK, payload, (response: any) => {
      console.log('[Ack] MARK 응답:', response);
    });
  };

  const unmarkPoi = (poiId: number | string) => {
    socketRef.current?.emit(PoiSocketEvent.UNMARK, { workspaceId, poiId });
  };

  return { pois, isSyncing, markPoi, unmarkPoi };
}
