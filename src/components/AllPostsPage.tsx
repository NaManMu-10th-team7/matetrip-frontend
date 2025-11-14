import { useState, useEffect } from 'react';
import { ClipboardList, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import client from '../api/client';
import { type Post } from '../types/post';
import { MainPostCardSkeleton } from './MainPostCardSkeleton';
import { WorkspaceCard } from './WorkspaceCard';
import { useAuthStore } from '../store/authStore';

interface AllPostsPageProps {
  onViewPost: (postId: string) => void;
  onSearch: (params: {
    startDate?: string;
    endDate?: string;
    location?: string;
    title?: string;
  }) => void;
  fetchTrigger: number;
}

export function AllPostsPage({ onViewPost, onSearch, fetchTrigger }: AllPostsPageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthLoading } = useAuthStore();

  useEffect(() => {
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }

    const fetchAllPosts = async () => {
      setIsLoading(true);
      try {
        const initialPostsResponse = await client.get<Post[]>('/posts');

        const sortedInitialPosts = initialPostsResponse.data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setPosts(sortedInitialPosts);
        console.log(`최신 동행 글 목록`, sortedInitialPosts);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllPosts();
  }, [isAuthLoading, fetchTrigger]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch({ title: searchQuery });
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-16 py-12">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-gray-900 mb-2">
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
            <Button
              variant="outline"
              className="gap-2 px-6 py-3 h-auto border-gray-200"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filters
            </Button>
          </div>
        </div>

        {/* Posts Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
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
                  onClick={() => onViewPost(post.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

