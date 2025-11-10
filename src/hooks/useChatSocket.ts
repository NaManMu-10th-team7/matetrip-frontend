import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const ChatEvent = {
  JOIN: 'join',
  JOINED: 'joined',
  LEAVE: 'leave',
  LEFT: 'left',
  MESSAGE: 'message',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
} as const;

export type ChatMessage = {
  username: string;
  message: string;
  timestamp: string; // 클라이언트에서 추가할 필드
  userId?: string; // userId 필드 추가
};

// Backend DTOs (simplified for frontend use)
type CreateMessageReqDto = {
  workspaceId: string;
  username: string;
  userId: string; // userId 추가
  message: string;
};

type JoinChatReqDto = {
  workspaceId: string;
  username: string;
};

type LeaveChatReqDto = {
  workspaceId: string;
  username: string;
};

type ChatMessageResDto = {
  username: string;
  message: string;
  userId?: string; // userId 필드 추가 (백엔드에서 보낼 것으로 가정)
};

export function useChatSocket(workspaceId: string) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuthStore();
  // user?.nickname 대신 user?.profile.nickname 사용
  const username = user?.profile?.nickname || 'Anonymous';
  const userId = user?.userId; // user 객체에서 userId를 가져옵니다.

  useEffect(() => {
    if (!workspaceId || !username) {
      console.warn('Workspace ID or username is missing. Skipping socket connection.');
      return;
    }

    const socket = io('http://localhost:3004/chat', {
      transports: ['websocket'],
      query: { workspaceId, username }, // 초기 연결 시 쿼리 파라미터로 전달
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Chat Socket connected:', socket.id);
      setIsConnected(true);
      // 서버에서 JOIN 이벤트를 처리하므로 클라이언트에서 별도로 emit하지 않아도 됨
      // 하지만, 명시적으로 JOIN 요청을 보내는 것이 더 안전할 수 있음
      socket.emit(ChatEvent.JOIN, { workspaceId, username } as JoinChatReqDto);
    });

    socket.on('disconnect', () => {
      console.log('Chat Socket disconnected');
      setIsConnected(false);
      setMessages([]); // 연결 끊기면 메시지 초기화
    });

    socket.on('error', (error: any) => {
      console.error('Chat Socket error:', error);
    });

    // 백엔드에서 JOINED 이벤트를 통해 메시지를 전달하므로, JOINED 이벤트를 수신
    socket.on(ChatEvent.JOINED, (payload: string | ChatMessageResDto) => {
      console.log('[Event] JOINED 수신:', payload);
      try {
        const parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;
        if (parsedPayload.username && parsedPayload.message) {
          // 일반 메시지
          setMessages((prevMessages) => [
            ...prevMessages,
            { ...parsedPayload, timestamp: new Date().toISOString() },
          ]);
        } else if (typeof parsedPayload.data === 'string') {
          // 사용자 입장 메시지
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              username: 'System',
              message: `${parsedPayload.data}님이 채팅방에 입장했습니다.`,
              timestamp: new Date().toISOString(),
              userId: undefined, // 시스템 메시지는 userId가 없을 수 있음
            },
          ]);
        }
      } catch (e) {
        console.error('Failed to parse JOINED payload:', payload, e);
      }
    });

    socket.on(ChatEvent.LEFT, (payload: { data: string }) => {
      console.log('[Event] LEFT 수신:', payload);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          username: 'System',
          message: `${payload.data}님이 채팅방을 나갔습니다.`,
          timestamp: new Date().toISOString(),
          userId: undefined, // 시스템 메시지는 userId가 없을 수 있음
        },
      ]);
    });

    // 백엔드에서 MESSAGE 이벤트를 직접 보내는 경우를 대비 (현재는 JOINED로 메시지 보냄)
    socket.on(ChatEvent.MESSAGE, (payload: ChatMessageResDto) => {
      console.log('[Event] MESSAGE 수신:', payload);
      setMessages((prevMessages) => [
        ...prevMessages,
        { ...payload, timestamp: new Date().toISOString() }, // userId가 payload에 포함되어 있다고 가정
      ]);
    });

    return () => {
      console.log('Disconnecting chat socket...');
      if (socketRef.current?.connected) {
        socketRef.current.emit(ChatEvent.LEAVE, { workspaceId, username } as LeaveChatReqDto);
      }
      socket.off('connect');
      socket.off('disconnect');
      socket.off('error');
      socket.off(ChatEvent.JOINED);
      socket.off(ChatEvent.LEFT);
      socket.off(ChatEvent.MESSAGE);
      socket.disconnect();
    };
  }, [workspaceId, user?.profile?.nickname, user?.userId]); // 의존성 배열에 userId 추가

  const sendMessage = useCallback(
    (message: string) => {
      if (socketRef.current && isConnected && message.trim() && userId) { // userId가 있는지 확인
        const messagePayload: CreateMessageReqDto = {
          workspaceId,
          username,
          userId, // userId 추가
          message,
        };
        console.log('[Client] Sending MESSAGE event:', messagePayload);
        socketRef.current.emit(ChatEvent.MESSAGE, messagePayload);
        // 자신의 메시지는 즉시 UI에 반영 (서버 응답을 기다리지 않음)
        // setMessages((prevMessages) => [ // 이 부분을 제거합니다.
        //   ...prevMessages,
        //   { username, message, timestamp: new Date().toISOString() },
        // ]);
      } else {
        console.warn('[Client] sendMessage condition not met:', {
          socketConnected: !!socketRef.current,
          isConnected,
          messageTrimmed: message.trim(),
          messageContent: message,
          userIdPresent: !!userId, // userId 존재 여부도 로그에 추가
        });
      }
    },
    [workspaceId, username, isConnected, userId], // 의존성 배열에 userId 추가
  );

  return { messages, sendMessage, isConnected };
}
