import { useState, useEffect, useRef, useCallback } from 'react';
import { ClipboardList, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import client from '../api/client';
import { type Post } from '../types/post';
import { MainPostCardSkeleton } from '../components/AIMatchingSkeletion';
import { WorkspaceCard } from '../components/WorkspaceCard';
import { useAuthStore } from '../store/authStore';
import { PostDetail } from './PostDetail'; // PostDetail 임포트
import PageContainer from '../components/PageContainer';

type SearchParams = {
  startDate?: string;
  endDate?: string;
  location?: string;
  title?: string;
};

interface AllPostsPageProps {
  // onViewPost: (postId: string) => void; // onViewPost prop 제거
  fetchTrigger: number;
  onJoinWorkspace: (postId: string, workspaceName: string) => void;
  onViewProfile: (userId: string) => void;
  onEditPost: (post: Post) => void;
  onDeleteSuccess?: () => void;
}

export function AllPostsPage({
  // onViewPost, // onViewPost prop 제거
  fetchTrigger,
  onJoinWorkspace,
  onViewProfile,
  onEditPost,
  onDeleteSuccess,
}: AllPostsPageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthLoading } = useAuthStore();

  // 필터 관련 상태
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);

  // PostDetail Panel 관련 상태
  const [showPostDetailPanel, setShowPostDetailPanel] = useState(false);
  const [selectedPostIdForPanel, setSelectedPostIdForPanel] = useState<
    string | null
  >(null);

  const fetchPosts = useCallback(
    async (params?: SearchParams) => {
      setIsLoading(true);
      // 빈 값은 쿼리에서 제거
      const filteredParams = params
        ? Object.entries(params).reduce(
            (acc, [key, value]) => {
              if (value) acc[key as keyof SearchParams] = value;
              return acc;
            },
            {} as SearchParams
          )
        : {};
      const query = new URLSearchParams(
        filteredParams as Record<string, string>
      ).toString();

      const endpoint = query ? `/posts/search?${query}` : '/posts';

      try {
        const response = await client.get<Post[]>(endpoint);
        const sortedPosts = response.data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setPosts(sortedPosts);
        console.log('동행 글 목록', sortedPosts);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }
    fetchPosts();
  }, [isAuthLoading, fetchPosts, fetchTrigger]);

  const handleSearch = (params?: SearchParams) => {
    fetchPosts(params);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    // 검색어가 없으면 목록을 다시 불러오지 않는다.
    if (!trimmed) return;
    handleSearch({ title: trimmed });
  };

  // 필터 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  // 필터 적용
  const handleApplyFilters = () => {
    handleSearch({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      location: location || undefined,
      title: searchQuery || undefined,
    });
    setIsFilterOpen(false);
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setLocation('');
    handleSearch(searchQuery ? { title: searchQuery } : undefined);
  };

  // 활성화된 필터 개수
  const activeFilterCount = [startDate, endDate, location].filter(Boolean).length;

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
      <PageContainer>
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            모든 동행 찾기
          </h1>
          <p className="text-base text-gray-600 mb-6">
            최신 동행 모집 게시글을 확인하세요
          </p>

          {/* Search Bar and Filters */}
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="여행지, 관심사, 여행 스타일로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </form>
            <div className="relative" ref={filterRef}>
              <Button
                variant="outline"
                className="gap-2 px-6 py-3 h-auto border-gray-200 relative"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <SlidersHorizontal className="w-5 h-5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {/* 필터 드롭다운 */}
              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">필터</h3>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* 시작일 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시작일
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 종료일 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      종료일
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 위치 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      위치
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="예: 서울, 부산, 제주..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 버튼 영역 */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleResetFilters}
                    >
                      초기화
                    </Button>
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleApplyFilters}
                    >
                      적용
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {isLoading ? (
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
              ) : (
                '최신 동행 모집'
              )}
            </h2>
          </div>
          {isLoading ? (
            <div className="flex flex-wrap gap-x-6 gap-y-12">
              {Array.from({ length: 6 }).map((_, index) => (
                <MainPostCardSkeleton key={index} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              최신 게시글이 없습니다.
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-6 gap-y-22">
              {posts.map((post) => (
                <WorkspaceCard
                  key={post.id}
                  post={post}
                  onClick={() => handleOpenPostDetailPanel(post.id)} // 패널 열기 핸들러 연결
                />
              ))}
            </div>
          )}
        </section>
      </PageContainer>

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
                console.log('🔵 [AllPostsPage] PostDetail onJoinWorkspace called', { postId, workspaceName });
                onJoinWorkspace(postId, workspaceName);
                handleClosePostDetailPanel();
              }}
              onViewProfile={(userId) => {
                console.log('🔵 [AllPostsPage] PostDetail onViewProfile called', { userId });
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
