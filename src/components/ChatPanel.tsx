import { useState, useEffect, useRef } from 'react';
import { Send, Phone, Video, User, MicOff, ChevronUp, ChevronDown } from 'lucide-react'; // Chevron 아이콘 추가
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
  const [isVCCallActive, setIsVCCallActive] = useState(false); // 화상통화 활성화 상태
  const [isVCPanelExpanded, setIsVCPanelExpanded] = useState(true); // 화상통화 패널 확장 상태
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
      <div className="border-b p-3 flex items-center justify-between">
        <h3 className="text-gray-900 font-semibold">채팅</h3>
        <div className="flex items-center gap-3">
          <Badge variant={isChatConnected ? "default" : "destructive"}>
            {isChatConnected ? "연결됨" : "연결 끊김"}
          </Badge>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="w-8 h-8" disabled>
              <Phone className="w-4 h-4 text-gray-600" />
            </Button>
            <Button
              size="icon"
              variant={isVCCallActive ? 'secondary' : 'ghost'}
              className="w-8 h-8"
              onClick={() => setIsVCCallActive(!isVCCallActive)}
            >
              <Video className="w-4 h-4 text-gray-600" />
            </Button>
          </div>
        </div>
      </div>

      {/* Collapsible Video Call Panel */}
      {isVCCallActive ? (
        <div className="bg-gray-800 text-white border-b transition-all duration-300">
          <div className="p-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold">화상 통화</h4>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 text-gray-300 hover:bg-gray-700 hover:text-white"
                onClick={() => setIsVCPanelExpanded(!isVCPanelExpanded)}
              >
                {isVCPanelExpanded ? '접기' : '펼치기'}
                {isVCPanelExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
            {isVCPanelExpanded && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                {/* Mock User Data - 실제로는 Workspace에서 멤버 목록을 받아와야 합니다. */}
                {['김민준', '이서연', '박도윤', user?.profile.nickname].map((name, index) => (
                  <div
                    key={index}
                    className="relative aspect-video bg-gray-700 rounded-md flex items-center justify-center"
                  >
                    <User className="w-10 h-10 text-gray-400" />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1">
                      <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                        {name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          // msg.userId와 currentUserId를 비교하여 자신의 메시지인지 판단
          const isMe =
            currentUserId != null && msg.userId === currentUserId;
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
            placeholder={isChatConnected ? '메시지를 입력하세요...' : '채팅 서버에 연결 중...'}
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
