import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const PublicOnlyRoute = () => {
  // 스토어에서 필요한 상태 가져옴
  const { isLoggedIn, isAuthLoading } = useAuthStore();

  // 인증 상태 확인 중 (isAuthLoading === true)
  // 아직 로그인 여부를 모르므로, 리디렉션 결정을 내릴 수 없음.
  // null을 반환해 깜빡임 현상 방지
  if (isAuthLoading) {
    return null;
  }

  // 인증 확인이 끝났고 (isAuthLoading === false) 로그인된 상태 (isLoggedIn === true) 일 때
  if (isLoggedIn) {
    // 메인 페이지('/')로 강제 이동
    return <Navigate to="/" replace />;
  }

  // 인증 확인이 끝났고 (isAuthLoading === false) 로그인되지 않은 상태 (isLoggedIn === false) 일 때
  // 자식 컴포넌트(Login, Register 페이지)를 정상적으로 보여줌
  return <Outlet />;
};

export default PublicOnlyRoute;
