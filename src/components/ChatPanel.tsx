import { useState, useEffect, useRef } from 'react';
import { Send, Bot, Phone, Video } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { type ChatMessage } from '../hooks/useChatSocket'; // ChatMessage 타입 import
import { useAuthStore } from '../store/authStore'; // useAuthStore import

interface ChatPanelProps {
  messages: ChatMessage[];
  sendMessage: (message: string) => void;
  isChatConnected: boolean;
}

export function ChatPanel({ messages, sendMessage, isChatConnected }: ChatPanelProps) {
  const [currentMessage, setCurrentMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore(); // 현재 사용자 정보 가져오기
  const currentUserId = user?.userId;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (currentMessage.trim() && isChatConnected) {
      sendMessage(currentMessage);
      setCurrentMessage('');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  // 디버깅을 위한 로그 추가
  useEffect(() => {
    console.log('--- ChatPanel Debug Info ---');
    console.log('Current User ID:', currentUserId);
    messages.forEach((msg, index) => {
      console.log(`Message ${index}:`, {
        username: msg.username,
        message: msg.message,
        msgUserId: msg.userId,
        isMeCheck: msg.userId === currentUserId,
      });
    });
    console.log('--------------------------');
  }, [messages, currentUserId]);


  return (
    <div className="h-full flex flex-col bg-white"> {/* h-full 다시 추가 */}
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <h3 className="text-gray-900">채팅</h3>
        <div className="flex gap-2">
          <Badge variant={isChatConnected ? "default" : "destructive"}>
            {isChatConnected ? "연결됨" : "연결 끊김"}
          </Badge>
          {/* <Button size="sm" variant="outline" className="gap-2">
            <Phone className="w-4 h-4" />
            음성통화
          </Button>
          <Button size="sm" variant="outline" className="gap-2">
            <Video className="w-4 h-4" />
            화상통화
          </Button> */}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          // msg.userId와 currentUserId를 비교하여 자신의 메시지인지 판단
          const isMe = msg.userId === currentUserId;
          const isSystem = msg.username === 'System';

          return (
            <div
              key={index} // 실제 서비스에서는 고유한 메시지 ID를 사용해야 합니다.
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${isMe ? 'order-2' : ''}`}>
                {!isMe && !isSystem && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-600">{msg.username}</span>
                  </div>
                )}
                <div
                  className={`rounded-lg px-4 py-2 ${
                    isMe
                      ? 'bg-blue-600 text-white'
                      : isSystem
                        ? 'bg-gray-100 text-gray-700 italic'
                        : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                </div>
                <span className={`text-xs text-gray-500 mt-1 block ${isMe ? 'text-right' : 'text-left'}`}>
                  {formatTimestamp(msg.timestamp)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder={isChatConnected ? "메시지를 입력하세요..." : "채팅 서버에 연결 중..."}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={!isChatConnected}
          />
          <Button
            onClick={handleSend}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            disabled={!isChatConnected || !currentMessage.trim()}
          >
            <Send className="w-4 h-4" />
            전송
          </Button>
        </div>
      </div>
    </div>
  );
}
