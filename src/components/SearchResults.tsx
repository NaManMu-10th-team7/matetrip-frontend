import { useState, useEffect } from 'react';
import { ArrowLeft, SlidersHorizontal, Search } from 'lucide-react';
import { Button } from './ui/button';
import { PostCard } from './PostCard';
import client from '../api/client';
import { type Post } from '../types/post';

interface SearchResultsProps {
  searchParams: {
    startDate?: string;
    endDate?: string;
    location?: string;
    title?: string;
  };
  onViewPost: (postId: string) => void;
}

export function SearchResults({
  searchParams,
  onViewPost,
}: SearchResultsProps) {
  const [results, setResults] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [sortBy, setSortBy] = useState<'match' | 'latest'>('match');

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const filteredParams = Object.entries(searchParams).reduce(
          (acc, [key, value]) => {
            if (value) acc[key] = value;
            return acc;
          },
          {} as Record<string, string>
        );
        const query = new URLSearchParams(filteredParams).toString();
        const endpoint = query ? `/posts/search?${query}` : '/posts';
        const response = await client.get<Post[]>(endpoint);

        // TODO: 매칭률순 정렬은 백엔드 API 구현 후 적용 필요
        const sortedResults = response.data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setResults(sortedResults);
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [searchParams]);

  const searchKeywords = Object.values(searchParams).filter(Boolean).join(', ');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4 gap-2"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4" />
          뒤로 가기
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-gray-900 mb-2">검색 결과</h1>
            {searchKeywords && !isLoading && (
              <p className="text-gray-600">
                "{searchKeywords}" 검색 결과 {results.length}개
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              필터
            </Button>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSortBy('match')}
                className={`px-4 py-2 rounded-md transition-colors text-sm ${
                  sortBy === 'match' ? 'bg-white shadow-sm' : 'text-gray-600'
                }`}
              >
                매칭률순
              </button>
              <button
                onClick={() => setSortBy('latest')}
                className={`px-4 py-2 rounded-md transition-colors text-sm ${
                  sortBy === 'latest' ? 'bg-white shadow-sm' : 'text-gray-600'
                }`}
              >
                최신순
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && <div className="text-center py-16">로딩 중...</div>}

      {/* Error State */}
      {error && (
        <div className="text-center py-16 text-red-500">
          오류가 발생했습니다: {error.message}
        </div>
      )}

      {/* Results Grid */}
      {!isLoading && !error && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((post) => (
            <div key={post.id} className="relative">
              <PostCard
                post={post}
                onClick={() => onViewPost(post.id)}
                // post.image가 없을 경우 기본 이미지 URL을 전달합니다.
                image={
                  'https://images.unsplash.com/photo-1533106418989-87423dec6922?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWx8ZW58MXx8fHwxNzIxNzE2MDMwfDA&ixlib=rb-4.1.0&q=80&w=1080'
                }
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && results.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-gray-900 mb-2">검색 결과가 없습니다</h3>
          <p className="text-gray-600">다른 조건으로 검색해보세요</p>
        </div>
      )}
    </div>
  );
}
