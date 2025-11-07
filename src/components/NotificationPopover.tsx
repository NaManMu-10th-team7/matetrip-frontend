import { useEffect, useState, type UIEvent } from 'react';
import { useNotificationStore } from '../store/useNotificationStore';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import { Bell } from 'lucide-react';
import { Badge } from './ui/badge';

export function NotificationPopover() {
  const {
    notifications,
    unreadCount,
    hasMore,
    isLoading,
    fetchInitialNotifications,
    fetchMoreNotifications,
    fetchUnreadCount,
    markNotificationAsRead,
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);

  // 프리페칭 (컴포넌트 마운트 시)
  useEffect(() => {
    fetchUnreadCount();
    fetchInitialNotifications();
  }, [fetchUnreadCount, fetchInitialNotifications]);

  // 클릭 시 새로고침 (팝오버 열릴 때)
  useEffect(() => {
    if (isOpen) {
      fetchInitialNotifications();
    }
  }, [isOpen, fetchInitialNotifications]);

  const handleNotificationClick = async (id: string) => {
    await markNotificationAsRead(id);
  };

  // 수동 스크롤 핸들러
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // 20px 남기고 미리 로드
    const buffer = 20;

    // 스크롤이 거의 끝에 닿았는지 확인
    if (
      target.scrollHeight - target.scrollTop - target.clientHeight <=
      buffer
    ) {
      if (hasMore && !isLoading) {
        // 다음 페이지 호출
        fetchMoreNotifications();
      }
    }
  };

  return (
    <Popover onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
              {unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="bg-white border shadow-lg rounded-lg p-0 flex flex-col"
        style={{ maxHeight: '430px', width: '400px' }}
      >
        <div className="p-4 space-y-2 mb-4 flex-shrink-0">
          <h4 className="font-medium leading-none">알림</h4>
        </div>

        {/* 스크롤 컨테이너 */}
        <div
          id="notification-scroll-container"
          className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 overscroll-behavior-contain"
          onScroll={handleScroll}
        >
          <div className="grid gap-2">
            {/* 1. 첫 페이지 로딩 중 */}
            {isLoading && notifications.length === 0 && (
              <p className="text-sm text-muted-foreground p-4 text-center">
                ...
              </p>
            )}
            {/* 2. 알림 없음 */}
            {!isLoading && notifications.length === 0 && (
              <p className="text-sm text-muted-foreground p-4 text-center">
                새로운 알림이 없습니다.
              </p>
            )}
            {/* 3. 알림 목록 */}
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`block px-4 py-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                  !notification.confirmed ? 'bg-blue-50' : 'bg-gray-100'
                }`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="grid gap-1.5 min-w-0">
                  <p className="text-sm font-medium leading-snug break-words">
                    {notification.content}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 4. 다음 페이지 로딩 중 (하단 스피너) */}
          {isLoading && notifications.length > 0 && (
            <p className="text-center text-sm p-2">...</p>
          )}
          {/* 5. 모든 알림 로드 완료 */}
          {!hasMore && notifications.length > 0 && <div className="h-4" />}
        </div>
      </PopoverContent>
    </Popover>
  );
}
