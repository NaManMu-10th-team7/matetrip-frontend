import { Map, FileText, Plane, Plus, LogIn } from 'lucide-react';
import { Button } from './ui/button';
import { useAuthStore } from '../store/authStore';
import { NotificationPanel } from './NotificationPanel';
import { useLocation, useNavigate } from 'react-router-dom';

interface SidebarProps {
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onProfileClick: () => void;
  onCreatePost: () => void;
}

export function Sidebar({
  isLoggedIn,
  onLoginClick,
  onProfileClick,
  onCreatePost,
}: SidebarProps) {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="bg-white border-r border-gray-200 h-screen w-64 flex flex-col shrink-0">
      {/* Logo Section */}
      <div className="border-b border-gray-200 px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Map className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-900">MateTrip</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-1">
          {/* 동행 찾기 - 항상 표시 */}
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('/')
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Plane className="w-5 h-5" />
            <span className="font-medium">AI 동행 찾기</span>
          </button>

          {/* 모든 동행 찾기 - 항상 표시 */}
          <button
            onClick={() => navigate('/all-posts')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('/all-posts')
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">모든 동행 찾기</span>
          </button>

          {/* 내 여행 - 로그인 사용자만 */}
          {isLoggedIn && (
            <button
              onClick={() => navigate('/my-trips')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/my-trips')
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Plane className="w-5 h-5" />
              <span className="font-medium">내 여행</span>
            </button>
          )}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-gray-200 px-4 py-4">
        {/* 새 여행 계획 버튼 - 로그인 사용자만 */}
        {isLoggedIn && (
          <Button
            onClick={onCreatePost}
            className="w-full mb-4 bg-gray-100 hover:bg-gray-200 text-gray-900 gap-2"
            variant="secondary"
          >
            <Plus className="w-4 h-4" />
            새 여행 계획
          </Button>
        )}

        {/* Profile or Login Section */}
        {isLoggedIn ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors">
            <button
              onClick={onProfileClick}
              className="flex items-center gap-3 flex-1"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                {user?.profile?.profileImageId ? (
                  <img
                    src={user.profile.profileImageId}
                    alt="profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={`https://ui-avatars.com/api/?name=${user?.profile?.nickname}&background=random`}
                    alt="profile"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.profile?.nickname || '사용자'}
                </p>
                <p className="text-xs text-gray-500">내 프로필</p>
              </div>
            </button>
            <NotificationPanel />
          </div>
        ) : (
          <Button
            onClick={onLoginClick}
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <LogIn className="w-4 h-4" />
            로그인
          </Button>
        )}
      </div>
    </div>
  );
}

