import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

// 백엔드의 PoiSocketEvent와 동일하게 정의합니다.
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
  POI_CONNECT: 'poi:connect',
  CONNECTED: 'connected',
  POI_DISCONNECT: 'poi:disconnect',
  DISCONNECTED: 'disconnected',
} as const;

// DayLayer 타입을 훅으로 이동하여 중앙에서 관리합니다.
// 백엔드의 DTO와 타입을 맞춥니다.
// 실제 프로젝트에서는 이 타입들을 공유하는 라이브러리로 분리하면 더 좋습니다.
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
  createdBy: string; // 현재 사용자 ID (임시)
  longitude: number;
  latitude: number;
  address: string;
  placeName?: string;
  planDayId?: string;
  categoryName?: string;
};

type RemovePoiDto = { workspaceId: string; poiId: number | string };

// 서버와 동기화할 때 받는 데이터 타입
type SyncPayload = {
  pois: Poi[];
};

export function usePoiSocket(workspaceId: string) {
  // 소켓 인스턴스를 ref로 관리하여 리렌더링 시에도 연결을 유지합니다.
  const socketRef = useRef<Socket | null>(null);
  const [pois, setPois] = useState<Poi[]>([]);
  // connections 상태는 더 이상 사용하지 않으므로 제거합니다.
  const { user } = useAuthStore();
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    // 백엔드 주소와 네임스페이스에 맞게 소켓을 연결합니다.
    const socket = io('http://localhost:3003/poi', {
      transports: ['websocket'], // 웹소켓을 우선적으로 사용하도록 설정
    });
    socketRef.current = socket;

    // 1. 연결 성공 시, 워크스페이스에 참여(join) 이벤트를 보냅니다.
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit(PoiSocketEvent.JOIN, { workspaceId });
    });

    // 2. 'joined' 이벤트를 받으면 콘솔에 로그를 남깁니다. (확인용)
    socket.on(PoiSocketEvent.JOINED, (data) => {
      console.log(`Joined workspace: ${data.workspaceId}`);
    });

    // SYNC 타임아웃 설정 (예: 10초)
    const syncTimeout = setTimeout(() => {
      console.error('SYNC 타임아웃: 서버 응답이 없습니다.');
      setIsSyncing(false);
      // 사용자에게 알림을 보여주는 로직을 추가할 수도 있습니다.
      // 예: alert('데이터를 불러오는 데 실패했습니다. 페이지를 새로고침해주세요.');
    }, 10000);

    // 3. 'sync' 이벤트: 서버로부터 초기 POI 목록을 받아 상태를 업데이트합니다.
    socket.on(PoiSocketEvent.SYNC, (payload: SyncPayload) => {
      clearTimeout(syncTimeout); // SYNC 성공 시 타임아웃을 제거합니다.
      console.log('Syncing Data:', payload);
      setPois(payload.pois || []); // payload.pois가 없을 경우를 대비해 빈 배열을 기본값으로 설정
      setIsSyncing(false);
    });

    // 4. 'marked' 이벤트: 다른 사용자가 추가한 POI를 실시간으로 반영합니다.
    socket.on(PoiSocketEvent.MARKED, (newPoi: Poi) => {
      setPois((prevPois) => [...prevPois, newPoi]);
    });

    // 5. 'unmarked' 이벤트: 다른 사용자가 삭제한 POI를 실시간으로 반영합니다.
    // 백엔드에서 { poiId: ... } 형태로 데이터를 보내주는 것에 맞춰 수정합니다.
    socket.on(PoiSocketEvent.UNMARKED, (data: { poiId: number | string }) => {
      console.log('POI Unmarked:', data);
      setPois((prevPois) => prevPois.filter((p) => p.id !== data.poiId));
    });

    // 컴포넌트 언마운트 시 소켓 연결을 해제합니다.
    return () => {
      console.log('Disconnecting socket...');
      clearTimeout(syncTimeout); // 컴포넌트 언마운트 시 타임아웃도 정리합니다.
      socket.emit(PoiSocketEvent.LEAVE, { workspaceId });
      socket.disconnect();
    };
  }, [workspaceId]); // workspaceId가 변경될 때만 소켓 연결을 다시 설정합니다.

  // POI 추가/삭제를 위한 함수를 반환합니다.
  const markPoi = (
    poiData: Omit<CreatePoiDto, 'workspaceId' | 'createdBy' | 'id'>
  ) => {
    // 로그인한 사용자가 없으면 작업을 중단합니다.
    if (!user?.userId) {
      console.error('인증된 사용자 정보가 없습니다. POI를 마킹할 수 없습니다.');
      return;
    }

    const payload = { ...poiData, workspaceId, createdBy: user.userId };
    console.log(
      '[시뮬레이션] POI 테이블 저장 데이터 (MARK 이벤트 전송):',
      payload
    );
    // emit의 세 번째 인자로 서버의 응답을 처리하는 콜백(ack)을 추가합니다.
    socketRef.current?.emit(PoiSocketEvent.MARK, payload, (response: any) => {
      // 백엔드에서 MARK 이벤트에 대한 응답으로 보내주는 데이터를 콘솔에 출력합니다.
      console.log('✅ MARK 이벤트에 대한 서버 응답:', response);
    });
  };

  const unmarkPoi = (poiId: number | string) => {
    socketRef.current?.emit(PoiSocketEvent.UNMARK, { workspaceId, poiId });
  };

  // connectPoi와 connections는 더 이상 사용하지 않으므로 반환 객체에서 제거합니다.
  return { pois, isSyncing, markPoi, unmarkPoi };
}
