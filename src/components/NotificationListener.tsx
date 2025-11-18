import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { toast } from 'sonner';
import { API_BASE_URL } from '../api/client.ts';

export const NotificationListener = () => {
  const { user } = useAuthStore();

  useEffect(() => {
    // 1. 유저 ID가 없으면 연결하지 않음
    if (!user?.userId) return;

    console.log(
      `[SSE] ${user.profile.nickname} 유저의 알림 구독을 시작합니다.`
    );

    // 2. NestJS 엔드포인트
    const eventSourceUrl = `${API_BASE_URL}/notifications/connect/`;

    // 3. EventSource 생성 시 { withCredentials: true } 옵션 추가
    const eventSource = new EventSource(eventSourceUrl, {
      withCredentials: true,
    });

    // 4. SSE 연결 성공 시 호출되는 이벤트
    eventSource.onopen = (event) => {
      console.log('[SSE] 연결이 성공적으로 열렸습니다.', event);
    };

    // 토스트 알림을 생성하는 공통 핸들러
    const handleToast = (
      content: string,
      toastFn:
        | typeof toast.success
        | typeof toast.error
        | typeof toast.info
        | typeof toast.warning
    ) => {
      const uniqueToastId = `notification-${Date.now()}`;
      toastFn(
        <div
          onClick={() => toast.dismiss(uniqueToastId)}
          style={{ cursor: 'pointer' }}
        >
          {content}
        </div>,
        { id: uniqueToastId, duration: 5000 }
      );
    };
    // 5. 백엔드에서 보내는 이벤트 타입별로 리스너 등록
    const addNotificationListener = (
      eventType: string,
      toastFn:
        | typeof toast.success
        | typeof toast.error
        | typeof toast.info
        | typeof toast.warning
    ) => {
      eventSource.addEventListener(eventType, (event) => {
        try {
          const notificationData = JSON.parse(event.data);
          console.log(`[SSE] '${eventType}' 알림 수신:`, notificationData);
          handleToast(notificationData.content, toastFn);
        } catch (error) {
          console.error(`[SSE] '${eventType}' 데이터 파싱 실패:`, error);
        }
      });
    };

    addNotificationListener('notification_success', toast.success);
    addNotificationListener('notification_error', toast.error);
    addNotificationListener('notification_warning', toast.warning);
    addNotificationListener('notification_info', toast.info);

    // 7. 뱃지 갱신 이벤트
    eventSource.addEventListener('unread-update', (event) => {
      try {
        const { unreadCount } = JSON.parse(event.data);

        useNotificationStore.getState().setUnreadCount(unreadCount);
      } catch (error) {
        console.error('[SSE] unread-update 데이터 파싱 실패 : ', error);
      }
    });

    // 8. 목록 미리 갱신 이벤트
    eventSource.addEventListener('list-stale', (_event) => {
      // 새 알림이 오면 1페이지 목록을 미리 갱신
      try {
        useNotificationStore.getState().fetchInitialNotifications();
      } catch (error) {
        console.error('[SSE] fetchInitialNotifications 호출 실패 : ', error);
      }
    });

    // 6. 에러 발생 시
    eventSource.onerror = (error) => {
      console.error('[SSE] 오류 발생:', error);

      // EventSource는 연결이 끊어지면 자동으로 재연결 시도
      // 401(Unauthorized) 등 인증 오류 시 수동으로 닫기
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('[SSE] 연결이 영구적으로 닫혔습니다.');
      }
    };

    // 7. 컴포넌트가 언마운트될 때(페이지 이동, 로그아웃 등) 연결을 닫음.
    return () => {
      console.log('[SSE] 연결을 종료합니다.');
      eventSource.close();
    };

    // 유저 ID가 변경될 때마다 재연결
  }, [user?.userId]);

  return null;
};
