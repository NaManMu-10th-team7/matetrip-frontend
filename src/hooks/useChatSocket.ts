import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { WEBSOCKET_CHAT_URL } from '../constants';

// AI가 보내주는 장소 데이터 타입
export type AiPlace = {
  name: string;
  address: string;
  road_address: string;
  x: number; // longitude
  y: number; // latitude
  category: string;
};
import { type ToolCallData } from '../types/chat'; // ToolCallData 타입 가져오기
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
  id: string; // 메시지 고유 ID 추가 (낙관적 업데이트 및 중복 방지용)
  username: string;
  message: string;
  timestamp: string; // 클라이언트에서 추가할 필드
  userId?: string; // userId 필드 추가
  role: 'user' | 'ai' | 'system'; // 메시지 역할 추가
  toolData?: ToolCallData[]; // AI 메시지인 경우 도구 데이터 추가
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

// 백엔드에서 수신하는 메시지 페이로드 타입 (AI 응답 포함)
type IncomingChatMessagePayload = {
  id: string; // 백엔드에서 제공하는 고유 ID
  username: string;
  message: string;
  userId?: string;
  role?: 'ai' | 'system' | 'user'; // 백엔드에서 역할 지정 가능
  toolData?: ToolCallData[]; // AI 메시지인 경우 도구 데이터 포함
};

export function useChatSocket(
  workspaceId: string,
  onAiPlacesUpdate: (places: AiPlace[]) => void
) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuthStore(); // user?.nickname 대신 user?.profile.nickname 사용
  // user?.nickname 대신 user?.profile.nickname 사용
  const username = user?.profile?.nickname || 'Anonymous';
  const userId = user?.userId; // user 객체에서 userId를 가져옵니다.

  // =================================================================
  // 🛠️ [핵심] 액션 분배기 (Action Dispatcher)
  // useEffect 밖으로 이동하여 무한 루프를 방지합니다.
  // =================================================================
  const executeFrontendAction = useCallback(
    (actionCode: string, data: any) => {
      console.log(`⚡ 웹소켓 액션 실행: ${actionCode}`);

      switch (actionCode) {
        case 'UPDATE_MAP':
          // AI가 추천한 장소 목록을 Workspace의 콜백을 통해 처리
          if (Array.isArray(data)) {
            console.log('UPDATE_MAP 실행, 데이터:', data);
            onAiPlacesUpdate(data as AiPlace[]);
          }
          break;
        case 'OPEN_SIDEBAR':
          // setIsSidebarOpen(true);
          console.log('OPEN_SIDEBAR 액션 호출됨');
          break;
        default:
          console.warn(`알 수 없는 액션: ${actionCode}`);
      }
    },
    [onAiPlacesUpdate]
  );

  useEffect(() => {
    if (!workspaceId || !username) {
      console.warn(
        'Workspace ID or username is missing. Skipping socket connection.'
      );
      return;
    }

    const socket = io(`${WEBSOCKET_CHAT_URL}/chat`, {
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

    // 메시지 처리 및 액션 실행을 위한 헬퍼 함수
    const processIncomingMessage = (payload: IncomingChatMessagePayload) => {
      setMessages((prevMessages) => {
        // 낙관적 업데이트된 메시지가 있다면 업데이트, 없으면 새로 추가
        const existingMessageIndex = prevMessages.findIndex(
          (msg) => msg.id === payload.id
        );
        console.log(`payload2`, payload);
        const newMessage: ChatMessage = {
          id: payload.id,
          username: payload.username || 'Unknown',
          message: payload.message,
          timestamp: new Date().toISOString(), // 서버 타임스탬프가 있다면 그것을 사용
          userId: payload.userId,
          role:
            payload.role || (payload.username === 'System' ? 'system' : 'user'), // 역할 지정
          toolData: payload.toolData,
        };

        if (existingMessageIndex > -1) {
          const updatedMessages = [...prevMessages];
          updatedMessages[existingMessageIndex] = newMessage;
          return updatedMessages;
        } else {
          return [...prevMessages, newMessage];
        }
      });

      // 도구 데이터가 있으면 액션 실행
      if (payload.toolData && payload.toolData.length > 0) {
        payload.toolData.forEach((tool: ToolCallData) => {
          tool.frontend_actions.forEach((action) => {
            // tool_output이 문자열일 경우 JSON으로 파싱
            let outputData = tool.tool_output;
            if (typeof outputData === 'string') {
              try {
                outputData = JSON.parse(outputData.replace(/'/g, '"'));
              } catch (e) {
                console.error('Failed to parse tool_output:', e);
              }
            }
            executeFrontendAction(action, outputData);
          });
        });
      }
    };

    socket.on(
      ChatEvent.JOINED,
      (payload: string | IncomingChatMessagePayload | IncomingChatMessagePayload[]) => {
        console.log('[Event] JOINED 수신:', payload); // payload: string | IncomingChatMessagePayload
        try {
          const parsedPayload =
            typeof payload === 'string' ? JSON.parse(payload) : payload;

          if (typeof parsedPayload.data === 'string') {
            // 시스템 입장 메시지
            setMessages((prevMessages) => [
              ...prevMessages,
              {
                id: `system-join-${Date.now()}-${Math.random()}`,
                username: 'System',
                message: `${parsedPayload.data}님이 채팅방에 입장했습니다.`,
                timestamp: new Date().toISOString(),
                userId: undefined,
                role: 'system',
              },
            ]);
          } else if (Array.isArray(parsedPayload)) {
            // [수정] 과거 채팅 기록 (배열) 처리
            console.log('과거 채팅 기록 수신:', parsedPayload);
            const historyMessages: ChatMessage[] = parsedPayload.map((p: IncomingChatMessagePayload) => ({
              id: p.id,
              username: p.username,
              message: p.message,
              timestamp: new Date().toISOString(), // TODO: 서버에서 타임스탬프를 준다면 그것을 사용
              userId: p.userId,
              role: p.role || 'user',
              toolData: p.toolData,
            }));
            // 과거 기록은 액션을 실행하지 않고 메시지 목록만 설정합니다.
            setMessages(historyMessages);
          } else {
            // payload가 예상치 못한 형식일 경우를 대비한 로그
            console.warn('Unhandled JOINED payload format:', parsedPayload);
          }
        } catch (e) {
          console.error('Failed to parse JOINED payload:', payload, e);
        }
      }
    );

    socket.on(ChatEvent.LEFT, (payload: { data: string }) => {
      // payload: { data: string }
      console.log('[Event] LEFT 수신:', payload);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: `system-left-${Date.now()}-${Math.random()}`, // 시스템 메시지 고유 ID
          username: 'System',
          message: `${payload.data}님이 채팅방을 나갔습니다.`,
          timestamp: new Date().toISOString(),
          userId: undefined, // 시스템 메시지는 userId가 없을 수 있음
          role: 'system',
        },
      ]);
    });

    socket.on(ChatEvent.MESSAGE, (payload: IncomingChatMessagePayload) => {
      // payload: IncomingChatMessagePayload
      console.log(`processIncomingMessage 실행!`);
      console.log(`payload`, payload);
      processIncomingMessage(payload);
    });

    return () => {
      console.log('Disconnecting chat socket...');
      if (socketRef.current?.connected) {
        socketRef.current.emit(ChatEvent.LEAVE, {
          workspaceId,
          username,
        } as LeaveChatReqDto);
      }
      socket.off('connect');
      socket.off('disconnect');
      socket.off('error');
      socket.off(ChatEvent.JOINED);
      socket.off(ChatEvent.LEFT);
      socket.off(ChatEvent.MESSAGE);
      socket.disconnect();
    };
  }, [workspaceId, username, onAiPlacesUpdate]);

  const sendMessage = useCallback(
    (message: string) => {
      if (socketRef.current && isConnected && message.trim() && userId) {
        // userId가 있는지 확인
        // const tempMessageId = `client-${Date.now()}-${Math.random()}`; // 낙관적 업데이트를 위한 임시 ID
        const messagePayload: CreateMessageReqDto = {
          workspaceId,
          username,
          userId, // userId 추가
          message,
        };
        console.log('[Client] Sending MESSAGE event:', messagePayload);
        socketRef.current.emit(ChatEvent.MESSAGE, messagePayload);
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
    [workspaceId, username, isConnected, userId] // 의존성 배열에 userId 추가
  );

  return { messages, sendMessage, isConnected };
}
