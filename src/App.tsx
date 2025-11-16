import { useState, useEffect, useCallback } from 'react';
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Outlet,
  useParams,
} from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { MainPage } from './components/MainPage';
import { AllPostsPage } from './components/AllPostsPage';
import { MyTripsPage } from './components/MyTripsPage';
import { AIChatPage } from './components/AIChatPage';
import { AIChatPanel } from './components/AIChatPanel';
import { InspirationPage } from './components/InspirationPage';
import { SearchResults } from './components/SearchResults';
import { PostDetail } from './components/PostDetail';
import { Workspace } from './components/Workspace';
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

// Layout component for pages with Sidebar
function Layout({
  isLoggedIn,
  onLoginClick,
  onProfileClick,
  onCreatePost,
  onAIChatClick,
}: {
  isLoggedIn: boolean;
  onLoginClick: () => void;
  onProfileClick: () => void;
  onCreatePost: () => void;
  onAIChatClick: () => void;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar
        isLoggedIn={isLoggedIn}
        onLoginClick={onLoginClick}
        onProfileClick={onProfileClick}
        onCreatePost={onCreatePost}
        onAIChatClick={onAIChatClick}
      />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
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

function AllPostsPageWrapper({
  onViewPost,
  fetchTrigger,
}: {
  onViewPost: (postId: string) => void;
  fetchTrigger: number;
}) {
  const navigate = useNavigate();

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
    <AllPostsPage
      onViewPost={onViewPost}
      onSearch={handleSearch}
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
    navigate('/');
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

/**
 * URL 경로에 따라 PostDetail 모달을 열어주는 트리거 컴포넌트입니다.
 * /posts/:id 경로로 직접 진입하거나 새로고침 시 모달이 열리도록 합니다.
 */
function PostDetailModalTrigger({
  onViewPost,
}: {
  onViewPost: (postId: string) => void;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      onViewPost(id);
    }
  }, [id, onViewPost, navigate]);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않습니다.
}

export default function App() {
  const navigate = useNavigate();

  // Zustand 스토어에서 상태와 액션을 가져옵니다.
  const { isLoggedIn, user, checkAuth, logout: storeLogout } = useAuthStore();

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

  const [chatPanelOpen, setChatPanelOpen] = useState(false);

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
    navigate('/login');
  };

  const handleProfileClick = () => {
    if (user?.userId) {
      // navigate('/profile');
      setProfileModalState({ open: true, userId: user.userId });
    }
  };

  const handleViewProfile = (userId: string) => {
    setProfileModalState({ open: true, userId });
  };

  const handleViewPost = useCallback(
    (postId: string) => {
      setPostDetailModalState({ open: true, postId });
      navigate(`/posts/${postId}`, { replace: true });
    },
    [navigate]
  );

  const handleDeleteSuccess = () => {
    setFetchTrigger((prev) => prev + 1); // fetch 트리거 상태 변경
  };

  const handleAIChatClick = () => {
    setChatPanelOpen(true);
  };

  return (
    <div className="h-screen bg-gray-50">
      {' '}
      {/* h-screen 유지 */}
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

        {/* Routes with Sidebar */}
        <Route
          element={
            <Layout
              isLoggedIn={isLoggedIn}
              onLoginClick={() => navigate('/login')}
              onProfileClick={handleProfileClick}
              onCreatePost={() => setShowCreatePost(true)}
              onAIChatClick={handleAIChatClick}
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
          <Route
            path="/all-posts"
            element={
              <AllPostsPageWrapper
                onViewPost={handleViewPost}
                fetchTrigger={fetchTrigger}
              />
            }
          />
          <Route path="/ai-chat" element={<AIChatPage />} />
          <Route path="/inspiration" element={<InspirationPage />} />
          <Route
            path="/save"
            element={
              <MyTripsPage
                onViewPost={handleViewPost}
                isLoggedIn={isLoggedIn}
                fetchTrigger={fetchTrigger}
              />
            }
          />
          <Route path="/search" element={<SearchResultsWrapper />} />
          <Route
            path="/posts/:id"
            element={
              <>
                {/* 배경으로 메인 페이지를 렌더링합니다. */}
                <MainPageWrapper
                  isLoggedIn={isLoggedIn}
                  onViewPost={handleViewPost}
                  onCreatePost={() => setShowCreatePost(true)}
                  fetchTrigger={fetchTrigger}
                />
                <PostDetailModalTrigger onViewPost={handleViewPost} />
              </>
            }
          />
          <Route path="/workspace/:id" element={<WorkspaceWrapper />} />
          <Route path="/review" element={<ReviewPageWrapper />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      {/* Modals */}
      <AIChatPanel
        open={chatPanelOpen}
        onOpenChange={setChatPanelOpen}
      />
      {showCreatePost && (
        <CreatePostModal onClose={() => setShowCreatePost(false)} />
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
        onLogoutClick={handleLogout}
      />
      {postDetailModalState.open && postDetailModalState.postId && (
        <Dialog
          open={postDetailModalState.open}
          onOpenChange={(open) => {
            if (!open) {
              setPostDetailModalState({ open: false, postId: null });
              navigate('/', { replace: true }); // 모달이 닫히면 URL을 메인으로 변경
            }
          }}
        >
          <DialogContent className="w-full !max-w-[1100px] h-[90vh] p-0 flex flex-col [&>button]:hidden border-0 rounded-lg overflow-hidden">
            <PostDetail
              postId={postDetailModalState.postId}
              onOpenChange={(open) => {
                if (!open) {
                  setPostDetailModalState({ open: false, postId: null });
                  navigate('/', { replace: true }); // 모달이 닫히면 URL을 메인으로 변경
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
                    console.error('Failed to create or join workspace:', error);
                    alert('워크스페이스에 입장하는 중 오류가 발생했습니다.');
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
