import { useEffect, useState, type UIEvent } from 'react';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { API_BASE_URL } from '../api/client';

const formatTimeAgo = (date: string) => {
  const now = new Date();
  const notificationDate = new Date(date);
  const seconds = Math.floor(
    (now.getTime() - notificationDate.getTime()) / 1000
  );

  if (seconds < 60) return `방금 전`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
};

const getNotificationTitle = (content: string): string => {
  if (content.includes('동행 신청이 도착했습니다')) return '동행 신청 도착';
  if (content.includes('동행 신청이 수락되었습니다')) return '동행 신청 수락';
  if (content.includes('새로운 리뷰가 작성되었습니다')) return '새로운 리뷰';
  if (content.includes('여행 일정이 업데이트되었습니다'))
    return '일정 업데이트';
  if (content.includes('동행이 확정되었습니다')) return '동행 확정';
  return '새로운 알림';
};

export function NotificationPanel() {
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

  useEffect(() => {
    fetchUnreadCount();
    fetchInitialNotifications();
  }, [fetchUnreadCount, fetchInitialNotifications]);

  useEffect(() => {
    if (isOpen) {
      fetchInitialNotifications();
    }
  }, [isOpen, fetchInitialNotifications]);

  const handleNotificationClick = async (id: string) => {
    await markNotificationAsRead(id);
  };

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const buffer = 20;
    if (
      target.scrollHeight - target.scrollTop - target.clientHeight <=
      buffer
    ) {
      if (hasMore && !isLoading) {
        fetchMoreNotifications();
      }
    }
  };

  const { user } = useAuthStore();
  useEffect(() => {
    if (!user?.userId) return;

    const eventSourceUrl = `${API_BASE_URL}/notifications/connect/`;
    const eventSource = new EventSource(eventSourceUrl, {
      withCredentials: true,
    });

    eventSource.onopen = () => {
      console.log('[SSE] 알림 서비스에 연결되었습니다.');
    };

    eventSource.addEventListener('new_notification', (event) => {
      try {
        const notificationData = JSON.parse(event.data);
        const uniqueToastId = `notification-${Date.now()}`;
        toast.info(
          <div
            onClick={() => toast.dismiss(uniqueToastId)}
            style={{ cursor: 'pointer' }}
          >
            {notificationData.content}
          </div>,
          { id: uniqueToastId, duration: 5000 }
        );
      } catch (error) {
        console.error('[SSE] 새 알림 처리 중 오류 발생:', error);
      }
    });

    eventSource.addEventListener('unread-update', (event) => {
      try {
        const { unreadCount } = JSON.parse(event.data);
        useNotificationStore.getState().setUnreadCount(unreadCount);
      } catch (error) {
        console.error(
          '[SSE] 읽지 않은 알림 개수 업데이트 중 오류 발생:',
          error
        );
      }
    });

    eventSource.addEventListener('list-stale', () => {
      try {
        useNotificationStore.getState().fetchInitialNotifications();
      } catch (error) {
        console.error('[SSE] 알림 목록 갱신 중 오류 발생:', error);
      }
    });

    eventSource.onerror = () => {
      console.error('[SSE] 오류가 발생하여 연결을 종료합니다.');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [user?.userId]);

  return (
    <Popover onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-5 h-5 text-gray-700" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0 max-h-[500px] overflow-hidden"
        align="end"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-900">알림</h3>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}개
              </span>
            )}
          </div>
        </div>
        <div className="overflow-y-auto max-h-[400px]" onScroll={handleScroll}>
          {isLoading && notifications.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">
              알림을 불러오는 중입니다...
            </div>
          )}
          {!isLoading && notifications.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">
              새로운 알림이 없습니다.
            </div>
          )}
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification.id)}
              className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
                !notification.confirmed ? 'bg-blue-50' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <h4 className="text-gray-900 text-sm font-semibold">
                      {getNotificationTitle(notification.content)}
                    </h4>
                    {!notification.confirmed && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">
                    {notification.content}
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    {formatTimeAgo(notification.createdAt)}
                  </p>
                </div>
              </div>
            </button>
          ))}
          {isLoading && notifications.length > 0 && (
            <div className="p-4 text-center text-sm bg-white text-gray-500">
              더 많은 알림을 불러오는 중...
            </div>
          )}
          {!hasMore && notifications.length > 0 && (
            <div className="p-4 text-center text-sm bg-white text-gray-500">
              모든 알림을 확인했습니다.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
