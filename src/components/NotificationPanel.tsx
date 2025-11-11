import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

export function NotificationPanel() {
  // 알림 데이터
  const notifications = [
    {
      id: '1',
      type: 'mate_request',
      title: '동행 신청이 도착했습니다',
      message: '김민수님이 "제주도 힐링 여행" 동행을 신청했습니다.',
      time: '5분 전',
      isRead: false,
    },
    {
      id: '2',
      type: 'mate_accepted',
      title: '동행 신청이 수락되었습니다',
      message: '이지은님이 회원님의 동행 신청을 수락했습니다.',
      time: '1시간 전',
      isRead: false,
    },
    {
      id: '3',
      type: 'review',
      title: '새로운 리뷰가 작성되었습니다',
      message: '박철수님이 회원님에게 별점 5점 리뷰를 남겼습니다.',
      time: '2시간 전',
      isRead: true,
    },
    {
      id: '4',
      type: 'plan_update',
      title: '여행 일정이 업데이트되었습니다',
      message: '"부산 바다 여행" 플랜룸에 새로운 일정이 추가되었습니다.',
      time: '1일 전',
      isRead: true,
    },
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-5 h-5 text-gray-700" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 max-h-[500px] overflow-hidden" align="end">
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
        <div className="overflow-y-auto max-h-[400px]">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
                !notification.isRead ? 'bg-blue-50' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <h4 className="text-gray-900 text-sm font-semibold">{notification.title}</h4>
                    {!notification.isRead && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{notification.message}</p>
                  <p className="text-gray-400 text-xs mt-2">{notification.time}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}