import { useState } from 'react';
import { Send, Bot, Phone, Video } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

const MOCK_MESSAGES = [
  {
    id: 1,
    sender: '여행러버',
    message: '안녕하세요! 잘 부탁드립니다 😊',
    time: '10:30',
    isMe: false,
  },
  {
    id: 2,
    sender: 'AI 에이전트',
    message: '제주도 여행을 도와드릴게요! 추천 여행지를 알려드릴까요?',
    time: '10:31',
    isBot: true,
  },
  { id: 3, sender: '나', message: '네 좋아요!', time: '10:32', isMe: true },
  {
    id: 4,
    sender: '바다조아',
    message: '성산일출봉 꼭 가보고 싶어요',
    time: '10:33',
    isMe: false,
  },
];

export function ChatPanel() {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) return;
    console.log('Send message:', message);
    setMessage('');
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <h3 className="text-gray-900">채팅</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-2">
            <Phone className="w-4 h-4" />
            음성통화
          </Button>
          <Button size="sm" variant="outline" className="gap-2">
            <Video className="w-4 h-4" />
            화상통화
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {MOCK_MESSAGES.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] ${msg.isMe ? 'order-2' : ''}`}>
              {!msg.isMe && (
                <div className="flex items-center gap-2 mb-1">
                  {msg.isBot ? (
                    <>
                      <Bot className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-gray-600">
                        {msg.sender}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        AI
                      </Badge>
                    </>
                  ) : (
                    <span className="text-sm text-gray-600">{msg.sender}</span>
                  )}
                </div>
              )}
              <div
                className={`rounded-lg px-4 py-2 ${
                  msg.isMe
                    ? 'bg-blue-600 text-white'
                    : msg.isBot
                      ? 'bg-purple-50 text-gray-900 border border-purple-200'
                      : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{msg.message}</p>
              </div>
              <span className="text-xs text-gray-500 mt-1 block">
                {msg.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder="메시지를 입력하세요..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button
            onClick={handleSend}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
            전송
          </Button>
        </div>
      </div>
    </div>
  );
}
