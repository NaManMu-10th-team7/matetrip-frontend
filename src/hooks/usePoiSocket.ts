import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore'; // isAuthLoading 제거
import { WEBSOCKET_POI_URL } from '../constants';
import type { WorkspaceMember as OriginalWorkspaceMember } from '../types/member.ts';
import { API_BASE_URL } from '../api/client';

// color 속성을 포함하는 새로운 타입을 정의합니다.
export type WorkspaceMember = OriginalWorkspaceMember & { color: string };

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
  POI_HOVER: 'poi:hover', // POI 호버 이벤트 추가
  POI_HOVERED: 'poi:hovered', // POI 호버 수신 이벤트 추가
  MAP_CLICK: 'map:click', // 지도 클릭 이벤트 추가
  MAP_CLICKED: 'map:clicked', // 지도 클릭 수신 이벤트 추가
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

// 다른 사용자가 호버한 POI 정보를 저장할 타입
export interface HoveredPoiInfo {
  poiId: string;
  userId: string;
  userName: string;
  userColor: string;
}

// 지도 클릭 효과를 위한 타입
export interface MapClickEffect {
  id: string;
  position: CursorPosition;
  userId: string;
  userColor: string;
  userName: string;
}

export function usePoiSocket(workspaceId: string, members: WorkspaceMember[]) {
  const socketRef = useRef<Socket | null>(null);
  const [pois, setPois] = useState<Poi[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const { user, isAuthLoading } = useAuthStore();
  const [cursors, setCursors] = useState<Record<string, Omit<UserCursor, 'userId'>>>({});
  const [hoveredPoiInfo, setHoveredPoiInfo] = useState<HoveredPoiInfo | null>(null);
  const [clickEffects, setClickEffects] = useState<MapClickEffect[]>([]); // 지도 클릭 효과 상태

  // useCallback을 사용하여 members 상태가 변경될 때마다 함수를 재생성합니다.
  // useEffect 밖으로 이동시킵니다.
  const handlePoiHovered = useCallback(
    (data: HoveredPoiInfo | null) => {
      if (data && data.poiId && data.userId !== user?.userId) {
        const member = members.find((m) => m.id === data.userId);
        if (member) {
          setHoveredPoiInfo({
            ...data,
            userName: member.profile.nickname,
            userColor: member.color,
          });
        } else if (!data?.poiId) setHoveredPoiInfo(null);
      } else {
        // data가 null이거나 내 이벤트일 경우 호버 정보 초기화
        setHoveredPoiInfo(null);
      }
    },
    [members, user?.userId] // members가 변경될 때마다 이 함수를 다시 생성합니다.
  );

  useEffect(() => {
    // [수정] 사용자 인증 정보 로딩이 완료될 때까지 소켓 연결을 지연시킵니다.
    if (isAuthLoading) {
      console.log('인증 정보 로딩 중... 소켓 연결을 대기합니다.');
      return;
    }

    const socket = io(`${WEBSOCKET_POI_URL}/poi`, { transports: ['websocket'] });
    socketRef.current = socket;

    const handleSync = (payload: { pois: Poi[] }) => {
      console.log('[Event] SYNC 수신:', payload);
      setPois(payload.pois || []);
      setIsSyncing(false);
    };

    const handleMarked = (data: Poi & { tempId?: string }) => {
      console.log('[Event] MARKED 수신:', data);
      if (data && data.id) {
        // [수정] 서버에서 받은 데이터에 status가 없을 경우를 대비하여 기본값을 'MARKED'로 설정합니다.
        // 이렇게 하면 낙관적 업데이트 데이터와 실제 데이터 간의 status 불일치 문제를 방지할 수 있습니다.
        const newPoiData = {
          ...data,
          status: data.status || 'MARKED',
          isPersisted: true,
        };

        setPois((prevPois) => {
          // tempId가 있고, 내 로컬 상태에 해당 임시 POI가 있는지 확인합니다.
          const isMyOptimisticUpdate =
            newPoiData.tempId && prevPois.some((p) => p.id === newPoiData.tempId);

          if (isMyOptimisticUpdate) {
            // 케이스 1: 내가 생성한 POI를 서버 데이터로 교체
            console.log(`[handleMarked] Optimistic POI ${newPoiData.tempId}를 실제 ID ${newPoiData.id}로 교체합니다.`);
            return prevPois.map((p) =>
              p.id === newPoiData.tempId ? newPoiData : p
            );
          }

          // 케이스 2: 다른 사용자가 생성한 POI이거나, 중복 이벤트 수신
          const existingPoiIndex = prevPois.findIndex((p) => p.id === newPoiData.id);
          if (existingPoiIndex > -1) {
            console.log(`[handleMarked] 기존 POI ${newPoiData.id}를 업데이트합니다.`);
            const newPois = [...prevPois];
            newPois[existingPoiIndex] = newPoiData;
            return newPois;
          }

          console.log(`[handleMarked] 다른 사용자가 생성한 새 POI ${newPoiData.id}를 추가합니다.`);
          return [...prevPois, newPoiData];
        });
      }
    };

    const handleUnmarked = (data: string | { poiId: string }) => {
      console.log('[Event] UNMARKED 수신:', data);
      // 서버에서 문자열로 보내주든, 객체({ poiId: '...' })로 보내주든 모두 처리
      const idToRemove = typeof data === 'string' ? data : data?.poiId;

      if (idToRemove) {
        setPois((prevPois) => {
          console.log(`Removing POI with id: ${idToRemove}`);
          return prevPois.filter((p) => p.id !== idToRemove);
        });
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

    const handleMapClicked = (data: Omit<MapClickEffect, 'id'>) => {
      console.log('[Event] MAP_CLICKED 수신:', data);
      // 내 클릭 이벤트는 로컬에서 즉시 처리되므로, 다른 사용자의 이벤트만 처리합니다.
      if (data.userId === user?.userId) return;

      const effectId = `${data.userId}-${Date.now()}`;
      const newEffect: MapClickEffect = { ...data, id: effectId };
      setClickEffects((prev) => [...prev, newEffect]);

      setTimeout(() => setClickEffects((prev) => prev.filter((effect) => effect.id !== effectId)), 1000); // 1초 후 효과 제거
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
    socket.on(PoiSocketEvent.CURSOR_MOVED, handleCursorMoved);
    socket.on(PoiSocketEvent.POI_HOVERED, handlePoiHovered);
    socket.on(PoiSocketEvent.MAP_CLICKED, handleMapClicked);

    return () => {
      console.log('Disconnecting socket...');
      socket.emit(PoiSocketEvent.LEAVE, { workspaceId });
      socket.off(PoiSocketEvent.SYNC, handleSync);
      socket.off(PoiSocketEvent.MARKED, handleMarked);
      socket.off(PoiSocketEvent.UNMARKED, handleUnmarked);
      socket.off(PoiSocketEvent.ADD_SCHEDULE, handleAddSchedule);
      socket.off(PoiSocketEvent.REMOVE_SCHEDULE, handleRemoveSchedule);
      socket.off(PoiSocketEvent.REORDER, handleReorder);
      socket.off(PoiSocketEvent.CURSOR_MOVED, handleCursorMoved);
      socket.off(PoiSocketEvent.POI_HOVERED, handlePoiHovered);
      socket.off(PoiSocketEvent.MAP_CLICKED, handleMapClicked);
      socket.disconnect();
    };
  }, [workspaceId, user?.userId, handlePoiHovered, isAuthLoading]); // [수정] isAuthLoading을 의존성 배열에 추가합니다.

  const markPoi = useCallback(
    (
      poiData: Omit<CreatePoiDto, 'workspaceId' | 'createdBy' | 'id'>,
      options: { isOptimistic?: boolean } = { isOptimistic: true }
    ) => {
      if (!user?.userId) {
        console.error('인증된 사용자 정보가 없습니다.');
        return;
      }

      const tempId = `poi-${Date.now()}-${Math.random()}`;
      const payload = { ...poiData, workspaceId, createdBy: user.userId };

      if (options.isOptimistic) {
        const newPoi: Poi = {
          id: tempId,
          status: 'MARKED',
          sequence: 0,
          isPersisted: false,
          ...payload,
        };
        setPois((prevPois) => [...prevPois, newPoi]);
      }

      socketRef.current?.emit(PoiSocketEvent.MARK, { ...payload, tempId });
    },
    [workspaceId, user?.userId, setPois]
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
      // 1. [추가] 낙관적 업데이트: 서버를 기다리지 않고 UI를 즉시 변경합니다.
      setPois((prevPois) => {
        const newSequenceMap = new Map(poiIds.map((id, index) => [id, index]));
        const otherPois = prevPois.filter(
          (p) => p.planDayId !== planDayId && !newSequenceMap.has(p.id)
        );
        const reorderedPois = prevPois
          .filter((p) => newSequenceMap.has(p.id))
          .map((p) => ({ ...p, sequence: newSequenceMap.get(p.id)! }))
          .sort((a, b) => a.sequence - b.sequence);

        return [...otherPois, ...reorderedPois];
      });

      // 2. [기존 로직] 서버에 변경사항을 알립니다.
      socketRef.current?.emit(PoiSocketEvent.REORDER, {
        workspaceId,
        planDayId,
        poiIds,
      });
    },
    [workspaceId]
  );

  const reorderMarkedPois = useCallback(
    (poiIds: string[]) => {
      setPois((prevPois) => {
        const newSequenceMap = new Map(poiIds.map((id, index) => [id, index]));
        const scheduledPois = prevPois.filter(
          (p) => p.status === 'SCHEDULED'
        );
        const reorderedMarkedPois = prevPois
          .filter((p) => newSequenceMap.has(p.id))
          .map((p) => ({ ...p, sequence: newSequenceMap.get(p.id)! }))
          .sort((a, b) => a.sequence - b.sequence);

        // 정렬되지 않은 나머지 MARKED POI가 있다면 여기에 추가하는 로직이 필요할 수 있으나,
        // 현재 로직은 reorder 대상만 처리합니다.
        return [...scheduledPois, ...reorderedMarkedPois];
      });
    },
    [setPois]
  );

  const moveCursor = useCallback(
    (position: CursorPosition) => {
      if (isAuthLoading || !user || !socketRef.current?.connected) return;

      const currentUserMemberInfo = members.find((member) => member.id === user.userId);

      const userAvatarUrl = currentUserMemberInfo?.profile.profileImageId
        ? `${API_BASE_URL}/binary-content/${currentUserMemberInfo.profile.profileImageId}/presigned-url`
        : `https://ui-avatars.com/api/?name=${currentUserMemberInfo?.profile.nickname || 'User'}&background=random`;

      const payload = {
        workspaceId,
        userId: user.userId,
        position,
        userName: currentUserMemberInfo?.profile.nickname || 'Unknown',
        userColor: currentUserMemberInfo?.color || '#FF0000',
        userAvatar: userAvatarUrl,
      };
      socketRef.current?.emit(PoiSocketEvent.CURSOR_MOVE, payload);
    },
    [workspaceId, user, isAuthLoading, members]
  );

  const hoverPoi = useCallback(
    (poiId: string | null) => {
      if (!user || !socketRef.current?.connected) return;
      socketRef.current?.emit(PoiSocketEvent.POI_HOVER, {
        workspaceId,
        poiId,
        userId: user.userId,
      });
      // 내가 호버한 아이템은 로컬에서 바로 반영하여 즉각적인 UI 반응을 유도
      const member = members.find((m) => m.id === user.userId);
      if (poiId && member) {
        setHoveredPoiInfo({ poiId, userId: user.userId, userName: member.profile.nickname, userColor: member.color });
      } else {
        setHoveredPoiInfo(null);
      }
    },
    [workspaceId, user, members]
  );

  const clickMap = useCallback(
    (position: CursorPosition) => {
      if (!user || !socketRef.current?.connected) return;
      const member = members.find((m) => m.id === user.userId);
      const userColor = member?.color || '#FF0000';
      const userName = member?.profile.nickname || 'Unknown';

      // 로컬에서 즉시 효과를 보여주기 위함
      const effectId = `${user.userId}-${Date.now()}`;
      const newEffect: MapClickEffect = { id: effectId, position, userId: user.userId, userColor, userName };
      setClickEffects((prev) => [...prev, newEffect]);
      setTimeout(() => setClickEffects((prev) => prev.filter((effect) => effect.id !== effectId)), 1000);
      console.log('[Event] MAP_CLICK 송신:', { workspaceId, position, userId: user.userId, userColor, userName });

      // 다른 사용자에게 이벤트 전파
      socketRef.current?.emit(PoiSocketEvent.MAP_CLICK, {
        workspaceId,
        position,
        userId: user.userId,
        userColor,
        userName,
      });
    }, [workspaceId, user, members]);

  return {
    pois,
    setPois,
    isSyncing,
    markPoi,
    unmarkPoi,
    addSchedule,
    removeSchedule,
    reorderPois,
    reorderMarkedPois,
    cursors,
    moveCursor,
    hoveredPoiInfo,
    hoverPoi,
    clickEffects, // 반환값에 추가
    clickMap, // 반환값에 추가
  };
}
