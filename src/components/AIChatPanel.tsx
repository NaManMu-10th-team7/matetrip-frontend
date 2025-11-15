import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search } from 'lucide-react';

interface AIChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIChatPanel({ open, onOpenChange }: AIChatPanelProps) {
  const navigate = useNavigate();

  // 채팅 목록 샘플 데이터
  const chatList = [
    { id: '1', title: 'New chat', isActive: true },
    { id: '2', title: '여행 계획 상담', isActive: false },
    { id: '3', title: 'asd', isActive: false },
  ];

  // ESC 키 이벤트 리스너
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscapeKey);
      // 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  const handleChatClick = (chatId: string) => {
    // 채팅방 클릭 시 full page로 이동
    onOpenChange(false);
    navigate('/ai-chat', { state: { selectedChatId: chatId } });
  };

  const handleBackgroundClick = () => {
    onOpenChange(false);
  };

  const handlePanelClick = (e: React.MouseEvent) => {
    // 패널 내부 클릭 시 이벤트 전파 중단 (배경 클릭으로 간주되지 않도록)
    e.stopPropagation();
  };

  if (!open) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={handleBackgroundClick}
        aria-label="Close chat panel"
      />

      {/* 우측 패널 */}
      <div
        className="fixed right-0 top-0 h-screen w-[400px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out"
        onClick={handlePanelClick}
      >
        {/* 헤더 */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              AI Chats
              <span className="text-sm font-normal text-gray-500">
                {chatList.length}
              </span>
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* 검색창 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search chat titles..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
        </div>

        {/* 채팅 목록 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <p className="text-xs text-gray-500 px-3 py-2 font-medium">
              Recent Chats
            </p>
            {chatList.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleChatClick(chat.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  chat.isActive
                    ? 'bg-gray-100 hover:bg-gray-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <p className="text-sm font-medium text-gray-900">
                  {chat.title}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* 하단 안내 */}
        <div className="border-t border-gray-200 p-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              💡 채팅방을 선택하면 전체 화면으로 이동합니다
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

