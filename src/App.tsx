import { useState } from 'react';
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

type View =
  | 'main'
  | 'search'
  | 'postDetail'
  | 'workspace'
  | 'profile'
  | 'review'
  | 'login'
  | 'signup';

export default function App() {
  // 현재 랜더링할 페이지
  const [currentView, setCurrentView] = useState<View>('main');
  // 유저의 로그인 상태
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  //모달
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showEditPost, setShowEditPost] = useState(false);

  // Navigation states
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useState<{
    date?: string;
    location?: string;
  } | null>(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentView('main');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('main');
  };

  const handleSearch = (params: { date?: string; location?: string }) => {
    setSearchParams(params);
    setCurrentView('search');
  };

  const handleViewPost = (postId: number) => {
    setSelectedPost(postId);
    setCurrentView('postDetail');
  };

  const handleJoinWorkspace = (postId: number) => {
    setSelectedPost(postId);
    setCurrentView('workspace');
  };

  const handleViewProfile = (userId?: number) => {
    setCurrentView('profile');
  };

  const handleStartReview = () => {
    setCurrentView('review');
  };

  const handleReviewComplete = () => {
    setCurrentView('main');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - 로그인/회원가입 페이지에서는 숨김 */}
      {currentView !== 'login' && currentView !== 'signup' && (
        <Header
          isLoggedIn={isLoggedIn}
          onLoginClick={() => setCurrentView('login')}
          onLogoutClick={handleLogout}
          onProfileClick={handleViewProfile}
          onCreatePost={() => setShowCreatePost(true)}
          onLogoClick={() => setCurrentView('main')}
        />
      )}

      <main>
        {currentView === 'login' && (
          <Login
            onLogin={handleLogin}
            onSignupClick={() => setCurrentView('signup')}
          />
        )}
        {currentView === 'signup' && (
          <Signup
            onSignup={handleLogin}
            onLoginClick={() => setCurrentView('login')}
          />
        )}
        {currentView === 'main' && (
          <MainPage onSearch={handleSearch} onViewPost={handleViewPost} />
        )}
        {currentView === 'search' && searchParams && (
          <SearchResults
            searchParams={searchParams}
            onViewPost={handleViewPost}
          />
        )}
        {currentView === 'postDetail' && selectedPost && (
          <PostDetail
            postId={selectedPost}
            isLoggedIn={isLoggedIn}
            onJoinWorkspace={handleJoinWorkspace}
            onEditPost={() => setShowEditPost(true)}
          />
        )}
        {currentView === 'workspace' && selectedPost && (
          <Workspace postId={selectedPost} onEndTrip={handleStartReview} />
        )}
        {currentView === 'profile' && (
          <Profile isLoggedIn={isLoggedIn} onViewPost={handleViewPost} />
        )}
        {currentView === 'review' && (
          <ReviewPage onComplete={handleReviewComplete} />
        )}
      </main>

      {/* Modals */}
      {showCreatePost && (
        <CreatePostModal onClose={() => setShowCreatePost(false)} />
      )}

      {showEditPost && selectedPost && (
        <EditPostModal
          postId={selectedPost}
          onClose={() => setShowEditPost(false)}
        />
      )}
    </div>
  );
}
