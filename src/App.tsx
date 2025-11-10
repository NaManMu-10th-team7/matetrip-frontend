import { useState, useEffect } from 'react';
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Outlet,
} from 'react-router-dom';
import { Header } from './components/Header';
import { MainPage } from './components/MainPage';
import { SearchResults } from './components/SearchResults';
import { PostDetail } from './components/PostDetail';
import { Workspace } from './components/Workspace';
import { Profile } from './components/Profile';
import { CreatePostModal } from './components/CreatePostModal';
import { EditPostModal } from './components/EditPostModal';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { ReviewPage } from './components/ReviewPage';
import { NotFound } from './components/NotFound';
import { useAuthStore } from './store/authStore'; // Zustand 스토어 임포트
import { NotificationListener } from './components/NotificationListener';
import client from './api/client';
import type { CreateWorkspaceResponse } from './types/workspace';
import type { Post } from './types/post';
import { Toaster } from 'sonner';
import { Dialog, DialogContent } from './components/ui/dialog';
import { ProfileModal } from './components/ProfileModal';
import PublicOnlyRoute from './components/PublicOnlyRoute';

// Layout component for pages with Header
function Layout({
  isLoggedIn,
  isAuthLoading,
  onLoginClick,
  onLogoutClick,
  onProfileClick,
  onCreatePost,
  onLogoClick,
  onSearch,
}: {
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onProfileClick: () => void;
  onCreatePost: () => void;
  onLogoClick: () => void;
  onSearch: (query: string) => void;
}) {
  return (
    <>
      <Header
        isLoggedIn={isLoggedIn}
        isAuthLoading={isAuthLoading}
        onLoginClick={onLoginClick}
        onLogoutClick={onLogoutClick}
        onProfileClick={onProfileClick}
        onCreatePost={onCreatePost}
        onLogoClick={onLogoClick}
        onSearch={onSearch}
      />
      <Outlet />
    </>
  );
}

// Wrapper components for route handling
function MainPageWrapper({
  isLoggedIn,
  onCreatePost,
  onViewPost,
  fetchTrigger,
}: {
  isLoggedIn: boolean;
  onCreatePost: () => void;
  onViewPost: (postId: string) => void;
  fetchTrigger: number;
}) {
  const navigate = useNavigate();
  const { isLoggedIn: isLoggedInFromStore } = useAuthStore(); // 스토어에서 직접 가져오기
  const finalIsLoggedIn = isLoggedIn ?? isLoggedInFromStore;

  const handleSearch = (params: {
    startDate?: string;
    endDate?: string;
    location?: string;
    title?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    if (params.location) searchParams.set('location', params.location);
    if (params.title) searchParams.set('title', params.title);
    navigate(`/search?${searchParams.toString()}`);
  };

  return (
    <MainPage
      onSearch={handleSearch}
      onViewPost={onViewPost}
      isLoggedIn={finalIsLoggedIn}
      onCreatePost={onCreatePost}
      fetchTrigger={fetchTrigger}
    />
  );
}

function SearchResultsWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const params = {
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    location: searchParams.get('location') || undefined,
    title: searchParams.get('title') || undefined,
  };

  const handleViewPost = (postId: string) => {
    navigate(`/posts/${postId}`);
  };

  return <SearchResults searchParams={params} onViewPost={handleViewPost} />;
}

function WorkspaceWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const workspaceId = location.pathname.split('/').pop() || ''; // 명확한 변수명으로 변경
  const workspaceName = location.state?.workspaceName || '워크스페이스'; // state에서 이름 가져오기
  const planDayDtos = location.state?.planDayDtos || [];

  const handleEndTrip = () => {
    navigate('/review');
  };

  return (
    <Workspace
      workspaceId={workspaceId}
      workspaceName={workspaceName}
      planDayDtos={planDayDtos}
      onEndTrip={handleEndTrip}
    />
  );
}

function LoginWrapper({ onLogin }: { onLogin: () => void }) {
  const navigate = useNavigate();

  const handleSignupClick = () => {
    navigate('/signup');
  };

  return <Login onLogin={onLogin} onSignupClick={handleSignupClick} />;
}

function SignupWrapper({ onSignup }: { onSignup: () => void }) {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  return <Signup onSignup={onSignup} onLoginClick={handleLoginClick} />;
}

function ReviewPageWrapper() {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate('/');
  };

  return <ReviewPage onComplete={handleComplete} />;
}

export default function App() {
  const navigate = useNavigate();

  // Zustand 스토어에서 상태와 액션을 가져옵니다.
  const {
    isLoggedIn,
    isAuthLoading,
    user,
    checkAuth,
    logout: storeLogout,
  } = useAuthStore();

  // 모달 상태
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showEditPost, setShowEditPost] = useState(false);
  const [selectedPostForEdit, setSelectedPostForEdit] = useState<Post | null>(
    null
  );
  const [profileModalState, setProfileModalState] = useState<{
    open: boolean;
    userId: string | null;
  }>({ open: false, userId: null });

  const [postDetailModalState, setPostDetailModalState] = useState<{
    open: boolean;
    postId: string | null;
  }>({ open: false, postId: null });

  const [fetchTrigger, setFetchTrigger] = useState(0);

  // 앱이 처음 로드될 때 쿠키를 통해 로그인 상태를 확인합니다.
  // checkAuth 함수는 Zustand 스토어에 의해 안정적으로 제공되므로 의존성 배열에 포함해도 안전합니다.
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogin = () => {
    // 로그인 성공 후, Zustand 스토어의 checkAuth를 호출하여 상태를 동기화합니다.
    // 이 시점에서 서버는 HttpOnly 쿠키를 설정했을 것입니다.
    checkAuth();
    navigate('/');
  };

  const handleLogout = async () => {
    await storeLogout(); // Zustand 스토어의 logout 액션을 호출하여 상태를 업데이트합니다.
    navigate('/');
  };

  const handleProfileClick = () => {
    if (user?.userId) {
      // navigate('/profile');
      setProfileModalState({ open: true, userId: user.userId });
    }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleSearch = (query: string) => {
    const searchParams = new URLSearchParams({ title: query });
    navigate(`/search?${searchParams.toString()}`);
  };

  const handleViewProfile = (userId: string) => {
    setProfileModalState({ open: true, userId });
  };

  const handleViewPost = (postId: string) => {
    setPostDetailModalState({ open: true, postId });
  };

  const handleDeleteSuccess = () => {
    setFetchTrigger((prev) => prev + 1); // fetch 트리거 상태 변경
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      {isLoggedIn && <NotificationListener />}
      <Routes>
        {/* Routes without Header */}
        <Route element={<PublicOnlyRoute />}>
          <Route
            path="/login"
            element={<LoginWrapper onLogin={handleLogin} />}
          />
          <Route
            path="/signup"
            element={<SignupWrapper onSignup={handleLogin} />} // 회원가입 후 자동 로그인 처리
          />
        </Route>

        {/* Routes with Header */}
        <Route
          element={
            <Layout
              isLoggedIn={isLoggedIn}
              isAuthLoading={isAuthLoading}
              onLoginClick={() => navigate('/login')}
              onLogoutClick={handleLogout}
              onProfileClick={handleProfileClick}
              onCreatePost={() => setShowCreatePost(true)}
              onLogoClick={handleLogoClick}
              onSearch={handleSearch}
            />
          }
        >
          <Route
            path="/"
            element={
              <MainPageWrapper
                isLoggedIn={isLoggedIn}
                onViewPost={handleViewPost}
                onCreatePost={() => setShowCreatePost(true)}
                fetchTrigger={fetchTrigger}
              />
            }
          />
          <Route path="/search" element={<SearchResultsWrapper />} />
          <Route
            path="/posts/:id"
            element={null} // 페이지 렌더링 대신 모달 사용
          />
          <Route path="/workspace/:id" element={<WorkspaceWrapper />} />
          <Route path="/review" element={<ReviewPageWrapper />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>

      {/* Modals */}
      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          onSuccess={() => {
            setShowCreatePost(false);
            handleDeleteSuccess(); // 재사용
          }}
        />
      )}
      {showEditPost && selectedPostForEdit && (
        <EditPostModal
          post={selectedPostForEdit}
          onClose={() => setShowEditPost(false)} // 사용자가 X 버튼이나 취소 버튼을 눌렀을 때
          onSuccess={() => {
            setShowEditPost(false); // 모달 닫기
            // PostDetail 모달이 열려있다면, 그 모달도 닫고 새로고침
            if (postDetailModalState.open) {
              setPostDetailModalState({ open: false, postId: null });
            }
            handleDeleteSuccess(); // 재사용
          }}
        />
      )}
      <ProfileModal
        open={profileModalState.open}
        onOpenChange={(open) =>
          setProfileModalState((prev) => ({ ...prev, open }))
        }
        userId={profileModalState.userId}
        onViewPost={handleViewPost}
      />

      {postDetailModalState.open && postDetailModalState.postId && (
        <Dialog
          open={postDetailModalState.open}
          onOpenChange={(open) => {
            if (!open) {
              setPostDetailModalState({ open: false, postId: null });
            }
          }}
        >
          <DialogContent className="w-full !max-w-[1100px] h-[90vh] p-0 flex flex-col [&>button]:hidden border-0 rounded-lg overflow-hidden">
            <PostDetail
              postId={postDetailModalState.postId}
              onOpenChange={(open) => {
                if (!open) {
                  setPostDetailModalState({ open: false, postId: null });
                }
              }}
              onViewProfile={handleViewProfile}
              onEditPost={(post) => {
                setPostDetailModalState({ open: false, postId: null });
                setSelectedPostForEdit(post);
                setShowEditPost(true);
              }}
              onJoinWorkspace={(postId, workspaceName) => {
                const createAndNavigate = async () => {
                  try {
                    const response = await client.post<CreateWorkspaceResponse>(
                      '/workspace',
                      { postId, workspaceName }
                    );
                    const { planDayDtos, workspaceResDto } = response.data;
                    const { id, workspaceName: resWorkspaceName } =
                      workspaceResDto;
                    setPostDetailModalState({ open: false, postId: null });
                    navigate(`/workspace/${id}`, {
                      state: {
                        workspaceName: resWorkspaceName,
                        planDayDtos,
                      },
                    });
                  } catch (error) {
                    console.error(
                      'Failed to create or join workspace:',
                      error
                    );
                    alert(
                      '워크스페이스에 입장하는 중 오류가 발생했습니다.'
                    );
                  }
                };
                createAndNavigate();
              }}
              onDeleteSuccess={handleDeleteSuccess}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
