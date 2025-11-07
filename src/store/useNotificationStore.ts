import { create } from 'zustand';
import type {
  INotificaionResponse,
  INotification,
} from '../types/notification';
import client from '../api/client';

interface NotificationState {
  unreadCount: number;
  notifications: INotification[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  setUnreadCount: (count: number) => void;
  fetchUnreadCount: () => Promise<void>;
  fetchInitialNotifications: () => Promise<void>;
  fetchMoreNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  notifications: [],
  page: 1,
  hasMore: true,
  isLoading: false,

  /**
   * 안읽은 알림 개수 반영
   */
  setUnreadCount: (count: number) => set({ unreadCount: count }),

  /**
   * 읽지 않은 알림 개수 가져오기
   */
  fetchUnreadCount: async () => {
    try {
      const response = await client.get<number>('/notifications/count');

      set({ unreadCount: response.data });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  /**
   * 첫 페이지 알림 가져오기
   */
  fetchInitialNotifications: async () => {
    const { isLoading, notifications } = get();

    if (isLoading) return;

    if (notifications.length === 0) {
      set({ isLoading: true });
    }

    try {
      // 1. 첫 페이지 데이터 가져오기 (페이지네이션 API 호출)
      const response = await client.get<INotificaionResponse>(
        '/notifications?page=1&limit=5' // 백엔드 @Get()
      );

      set({
        notifications: response.data.data,
        page: 2,
        hasMore: response.data.hasMore,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch initial notifications:', error);
      set({ isLoading: false });
    }
  },

  /**
   * 다음 페이지 알림 가져오기 (무한 스크롤)
   */
  fetchMoreNotifications: async () => {
    const { isLoading, hasMore, page } = get();

    if (isLoading || !hasMore) return;

    set({ isLoading: true });

    try {
      const response = await client.get<INotificaionResponse>(
        `/notifications?page=${page}&limit=5`
      );

      set((state) => ({
        notifications: [...state.notifications, ...response.data.data],
        page: state.page + 1,
        hasMore: response.data.hasMore,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to fetch more notifications:', error);
      set({ isLoading: false });
    }
  },

  /**
   * 개별 알림 읽음 처리
   * @param notificationId
   */
  markNotificationAsRead: async (notificationId: string) => {
    // 스토어에서 알림을 찾아 이미 읽었는지 확인
    const target = get().notifications.find((n) => n.id === notificationId);

    // 이미 읽음 처리된 알림은 API를 호출하지 않음
    if (target?.confirmed) {
      console.log('Already confirmed:', notificationId);
      return;
    }

    try {
      // 1. 백엔드에 개별 읽음 처리 API 호출
      await client.patch(`/notifications/${notificationId}/read`);

      // 2. API 호출 성공 시, 프론트엔드 상태 즉시 업데이트
      set((state) => ({
        // notifications 배열에서 해당 id의 confirmed 값을 true로 변경
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, confirmed: true } : n
        ),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },
}));
