import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export const NotificationListener = () => {
  const { user } = useAuthStore();

  useEffect(() => {
    // 1. 유저 ID가 없으면 연결하지 않음
    if (!user?.userId) return;

    console.log(
      `[SSE] ${user.profile.nickname} 유저의 알림 구독을 시작합니다.`
    );

    // 2. NestJS 엔드포인트
    const eventSourceUrl = 'http://localhost:3000/notifications/connect/';

    // 3. EventSource 생성 시 { withCredentials: true } 옵션 추가
    const eventSource = new EventSource(eventSourceUrl, {
      withCredentials: true,
    });

    // 4. SSE 연결 성공 시 호출되는 이벤트
    eventSource.onopen = (event) => {
      console.log('[SSE] 연결이 성공적으로 열렸습니다.', event);
    };

    // 5. 서버에서 'new_notification' (서비스에서 정한 type) 이벤트를 보냈을 때
    eventSource.addEventListener('new_notification', (event) => {
      try {
        // event.data는 서버에서 보낸 JSON 문자열
        const notificationData = JSON.parse(event.data);

        console.log('[SSE] 새 알림 수신 : ', notificationData);

        // 실제 알림 UI를 띄움
        // 임시로 alert 사용
        alert(notificationData.content);
      } catch (error) {
        console.error('[SSE] 알림 데이터 파싱 실패:', error);
      }
    });

    // 6. 에러 발생 시
    eventSource.onerror = (error) => {
      console.error('[SSE] 오류 발생:', error);

      // EventSource는 연결이 끊어지면 자동으로 재연결 시도
      // 401(Unauthorized) 등 인증 오류 시 수동으로 닫기
      eventSource.close();
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
