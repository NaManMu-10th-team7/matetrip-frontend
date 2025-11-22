import { useState, useEffect } from 'react';
import { ClipboardList } from 'lucide-react';
import client from '../api/client';
import { type Post } from '../types/post';
import { MainPostCardSkeleton } from '../components/AIMatchingSkeletion';
import { WorkspaceCarousel } from '../components/WorkspaceCarousel';
import { useAuthStore } from '../store/authStore';
import { PostDetail } from './PostDetail'; // PostDetail 임포트

interface MyTripsPageProps {
  // onViewPost: (postId: string) => void; // onViewPost prop 제거
  isLoggedIn: boolean;
  fetchTrigger: number;
  onJoinWorkspace: (postId: string, workspaceName: string) => void;
  onViewProfile: (userId: string) => void;
  onEditPost: (post: Post) => void;
  onDeleteSuccess?: () => void;
}

export function MyTripsPage({
  // onViewPost, // onViewPost prop 제거
  isLoggedIn,
  fetchTrigger,
  onJoinWorkspace,
  onViewProfile,
  onEditPost,
  onDeleteSuccess,
}: MyTripsPageProps) {
  const [plannedPosts, setPlannedPosts] = useState<Post[]>([]);
  const [participatingPosts, setParticipatingPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthLoading } = useAuthStore();

  // PostDetail Panel 관련 상태
  const [showPostDetailPanel, setShowPostDetailPanel] = useState(false);
  const [selectedPostIdForPanel, setSelectedPostIdForPanel] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    const fetchUserPosts = async () => {
      setIsLoading(true);
      try {
        if (isLoggedIn && user?.userId) {
          const userPostsResponse = await client.get<Post[]>(
            `/posts/user/${user.userId}`
          );

          const sortedUserPosts = userPostsResponse.data.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          const planned = sortedUserPosts.filter(
            (post) => post.writer && post.writer.id === user.userId
          );
          const participating = sortedUserPosts.filter(
            (post) =>
              post.writer &&
              post.writer.id !== user.userId &&
              post.participations.some(
                (p) => p.requester.id === user.userId && p.status === '승인'
              )
          );

          setPlannedPosts(planned);
          setParticipatingPosts(participating);
        } else {
          setPlannedPosts([]);
          setParticipatingPosts([]);
        }
      } catch (error) {
        console.error('Failed to fetch user posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserPosts();
  }, [isLoggedIn, user?.userId, isAuthLoading, fetchTrigger]);

  // PostDetail Panel 열기 핸들러
  const handleOpenPostDetailPanel = (postId: string) => {
    setSelectedPostIdForPanel(postId);
    setShowPostDetailPanel(true);
  };

  // PostDetail Panel 닫기 핸들러
  const handleClosePostDetailPanel = () => {
    setShowPostDetailPanel(false);
    setSelectedPostIdForPanel(null);
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-16 py-12">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-gray-900 mb-2">
            {isLoading ? (
              <div className="h-9 bg-gray-200 rounded w-48 animate-pulse"></div>
            ) : (
              `${user?.profile.nickname}님의 여행`
            )}
          </h1>
          <p className="text-base text-gray-600">
            참여중인 여행과 작성한 게시글을 확인하세요
          </p>
        </div>

        {/* User's Participating Trips Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {isLoading ? (
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
              ) : (
                `내가 참여중인 여행`
              )}
            </h2>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <MainPostCardSkeleton key={index} />
              ))}
            </div>
          ) : participatingPosts.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              참여중인 여행이 없습니다.
            </div>
          ) : (
            <WorkspaceCarousel
              posts={participatingPosts}
              onCardClick={(post) => handleOpenPostDetailPanel(post.id)} // 패널 열기 핸들러 연결
            />
          )}
        </section>

        {/* User's Created Posts Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <ClipboardList className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {isLoading ? (
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
              ) : (
                '내가 계획한 여행'
              )}
            </h2>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <MainPostCardSkeleton key={index} />
              ))}
            </div>
          ) : plannedPosts.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              작성한 게시글이 없습니다.
            </div>
          ) : (
            <WorkspaceCarousel
              posts={plannedPosts}
              onCardClick={(post) => handleOpenPostDetailPanel(post.id)} // 패널 열기 핸들러 연결
            />
          )}
        </section>
      </div>

      {/* PostDetail Panel 및 오버레이 */}
      <div
        className={`fixed inset-0 z-20 bg-black/50 transition-opacity duration-300 ${
          showPostDetailPanel
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClosePostDetailPanel}
      >
        {/* PostDetail Panel */}
        <div
          className={`fixed right-0 top-0 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-30
            ${showPostDetailPanel ? 'translate-x-0' : 'translate-x-full'} w-1/2`}
          onClick={(e) => e.stopPropagation()} // 패널 내부 클릭 시 오버레이 닫힘 방지
        >
          {selectedPostIdForPanel && (
            <PostDetail
              postId={selectedPostIdForPanel}
              onOpenChange={handleClosePostDetailPanel}
              onJoinWorkspace={(postId, workspaceName) => {
                console.log('🔵 [MyTripsPage] PostDetail onJoinWorkspace called', { postId, workspaceName });
                onJoinWorkspace(postId, workspaceName);
                handleClosePostDetailPanel();
              }}
              onViewProfile={(userId) => {
                console.log('🔵 [MyTripsPage] PostDetail onViewProfile called', { userId });
                // 프로필 모달 열기: PostDetail 패널은 유지
                onViewProfile(userId);
              }}
              onEditPost={onEditPost}
              onDeleteSuccess={onDeleteSuccess || (() => {})}
            />
          )}
        </div>
      </div>
    </div>
  );
}
