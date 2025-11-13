import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { WEBSOCKET_POI_URL } from '../constants';
import type { WorkspaceMember } from '../types/member.ts';
import { API_BASE_URL } from '../api/client';

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
  CURSOR_MOVE: 'cursorMove',
  CURSOR_MOVED: 'cursorMoved',
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
  address: string;
  placeName?: string;
  planDayId?: string;
  categoryName?: string;
};

export type CursorPosition = {
  lat: number;
  lng: number;
};

export type UserCursor = {
  userId: string;
  position: CursorPosition;
  userName: string;
  userColor: string;
  userAvatar: string;
};

export function usePoiSocket(workspaceId: string) {
  const socketRef = useRef<Socket | null>(null);
  const [pois, setPois] = useState<Poi[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const { user } = useAuthStore();
  useEffect(() => {
    const socket = io(`${WEBSOCKET_POI_URL}/poi`, {
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
          const poiWithStatus = {
            ...newPoi,
            status: newPoi.status || 'MARKED',
          };
          if (prevPois.some((p) => p.id === poiWithStatus.id)) {
            return prevPois.map((p) =>
              p.id === poiWithStatus.id ? poiWithStatus : p
            );
          }
          return [...prevPois, poiWithStatus];
        });
      }
    };

    const handleUnmarked = (poiId: string) => {
      // data 객체 대신 poiId 문자열을 직접 받도록 변경
      console.log('[Event] UNMARKED 수신:', poiId);
      if (poiId) {
        // poiId가 유효한지 확인
        setPois((prevPois) => prevPois.filter((p) => p.id !== poiId));
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

    const handleRemoveSchedule = (data: {
      poiId: string;
      planDayId: string;
    }) => {
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
      const newSequenceMap = new Map(
        data.poiIds.map((id, index) => [id, index])
      );
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
  }, [workspaceId, user?.userId]);

  const markPoi = useCallback(
    (poiData: Omit<CreatePoiDto, 'workspaceId' | 'createdBy' | 'id'>) => {
      if (!user?.userId) {
        console.error('인증된 사용자 정보가 없습니다.');
        return;
      }
      const payload = { ...poiData, workspaceId, createdBy: user.userId };
      socketRef.current?.emit(PoiSocketEvent.MARK, payload, (response: any) => {
        console.log('[Ack] MARK 응답:', response);
      });
    },
    [workspaceId, user?.userId]
  );

  const unmarkPoi = useCallback(
    (poiId: number | string) => {
      socketRef.current?.emit(PoiSocketEvent.UNMARK, { workspaceId, poiId });
    },
    [workspaceId]
  );

  const addSchedule = useCallback(
    (poiId: string, planDayId: string) => {
      socketRef.current?.emit(PoiSocketEvent.ADD_SCHEDULE, {
        workspaceId,
        poiId,
        planDayId,
      });
    },
    [workspaceId]
  );

  const removeSchedule = useCallback(
    (poiId: string, planDayId: string) => {
      socketRef.current?.emit(PoiSocketEvent.REMOVE_SCHEDULE, {
        workspaceId,
        poiId,
        planDayId,
      });
    },
    [workspaceId]
  );

  const reorderPois = useCallback(
    (planDayId: string, poiIds: string[]) => {
      socketRef.current?.emit(PoiSocketEvent.REORDER, {
        workspaceId,
        planDayId,
        poiIds,
      });
    },
    [workspaceId]
  );

  return {
    pois,
    setPois,
    isSyncing,
    markPoi,
    unmarkPoi,
    addSchedule,
    removeSchedule,
    reorderPois,
  };
}

export function useCursorSocket(workspaceId: string, members: WorkspaceMember[]) {
  const socketRef = useRef<Socket | null>(null);
  const [cursors, setCursors] = useState<
    Record<string, Omit<UserCursor, 'userId'>>
  >({});
  const { user, isAuthLoading } = useAuthStore();

  useEffect(() => {
    const socket = io(`${WEBSOCKET_POI_URL}/poi`, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    const handleCursorMoved = (data: UserCursor) => {
      if (data.userId === user?.userId) return; // 내 커서는 표시하지 않음
      setCursors((prevCursors) => ({
        ...prevCursors,
        [data.userId]: {
          position: data.position,
          userName: data.userName,
          userColor: data.userColor,
          userAvatar: data.userAvatar,
        },
      }));
    };

    socket.on('connect', () => {
      socket.emit(PoiSocketEvent.JOIN, { workspaceId });
    });

    socket.on(PoiSocketEvent.CURSOR_MOVED, handleCursorMoved);

    return () => {
      socket.emit(PoiSocketEvent.LEAVE, { workspaceId });
      socket.off(PoiSocketEvent.CURSOR_MOVED, handleCursorMoved);
      socket.disconnect();
    };
  }, [workspaceId, user?.userId]);

  const moveCursor = useCallback(
    (position: CursorPosition) => {
      if (isAuthLoading || !user || !socketRef.current?.connected) return;

      const currentUserMemberInfo = members.find(
        (member) => member.id === user.userId
      );

      const userAvatarUrl = currentUserMemberInfo?.profile.profileImageId
        ? `${API_BASE_URL}/binary-content/${currentUserMemberInfo.profile.profileImageId}/presigned-url`
        : `https://ui-avatars.com/api/?name=${currentUserMemberInfo?.profile.nickname || 'User'}&background=random`;

      const payload = {
        workspaceId,
        userId: user.userId,
        position,
        userName: currentUserMemberInfo?.profile.nickname || 'Unknown',
        // 여기서 색상을 결정할 수 있습니다. 예시로 generateColorFromString 사용
        userColor: '#FF0000', // 임시 색상. 실제로는 사용자별 고유 색상 로직 필요
        userAvatar: userAvatarUrl,
      };
      socketRef.current?.emit(PoiSocketEvent.CURSOR_MOVE, payload);
    },
    [workspaceId, user, isAuthLoading, members]
  );

  return {
    cursors,
    moveCursor,
  };
}
