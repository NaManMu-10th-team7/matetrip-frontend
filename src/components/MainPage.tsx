import { useState, useEffect } from 'react';
import {
  Plus,
  MapPin,
  ClipboardList,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from './ui/dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import client from '../api/client';
import { type Post } from '../types/post';
import { PostDetail } from './PostDetail';
import { MainPostCard } from './MainPostCard';
import { MainPostCardSkeleton } from './MainPostCardSkeleton';

interface MainPageProps {
  onSearch: (params: {
    startDate?: string;
    endDate?: string;
    location?: string;
    title?: string;
  }) => void;
  onUserClick: (userId: string) => void;
  onCreatePost: () => void;
  isLoggedIn: boolean;
}

// TODO: 백엔드 연동 시 API에서 추천 사용자 목록 가져오기
// const RECOMMENDED_USERS = await fetchRecommendedUsers();
const RECOMMENDED_USERS = [
  {
    id: '1',
    name: '바다조아',
    avatar: '',
    travelStyle: ['힐링', '사진', '맛집투어'],
    matchRate: 95,
  },
  {
    id: '2',
    name: '산악인',
    avatar: '',
    travelStyle: ['액티브', '등산', '자연'],
    matchRate: 88,
  },
  {
    id: '3',
    name: '도시탐험가',
    avatar: '',
    travelStyle: ['카페', '쇼핑', '핫플'],
    matchRate: 82,
  },
];

const REGION_CATEGORIES = [
  {
    id: 1,
    name: '제주도',
    image:
      'https://images.unsplash.com/photo-1614088459293-5669fadc3448?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBkZXN0aW5hdGlvbnxlbnwxfHx8fDE3NjE4NjQwNzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    description: '힐링 여행의 성지',
  },
  {
    id: 2,
    name: '부산',
    image:
      'https://images.unsplash.com/photo-1665231342828-229205867d94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMHBhcmFkaXNlfGVufDF8fHx8MTc2MTg4Mzg2MHww&ixlib=rb-4.1.0&q=80&w=1080',
    description: '바다와 도시의 조화',
  },
  {
    id: 3,
    name: '서울',
    image:
      'https://images.unsplash.com/photo-1597552661064-af143a5f3bee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZW91bCUyMGtvcmVhfGVufDF8fHx8MTc2MTk4MjQzNHww&ixlib=rb-4.1.0&q=80&w=1080',
    description: '트렌디한 도심 여행',
  },
  {
    id: 4,
    name: '경주',
    image:
      'https://images.unsplash.com/photo-1668850443435-c01eec56c4e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneWVvbmdqdSUyMGtvcmVhfGVufDF8fHx8MTc2MTk4MjQzNHww&ixlib=rb-4.1.0&q=80&w=1080',
    description: '역사 문화 탐방',
  },
  {
    id: 5,
    name: '강릉',
    image:
      'https://images.unsplash.com/photo-1684042229029-8a899193a8e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW5nbmV1bmclMjBrb3JlYXxlbnwxfHx8fDE3NjE5ODI0MzV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    description: '동해안의 낭만',
  },
  {
    id: 6,
    name: '전주',
    image:
      'https://images.unsplash.com/photo-1520645521318-f03a712f0e67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwdHJhdmVsfGVufDF8fHx8MTc2MTkxMjEzMXww&ixlib=rb-4.1.0&q=80&w=1080',
    description: '맛집 투어의 메카',
  },
];

export function MainPage({
  onSearch,
  onUserClick,
  onCreatePost,
  isLoggedIn,
}: MainPageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialPosts = async () => {
      setIsLoading(true);
      try {
        const response = await client.get<Post[]>('/post');
        // 최신 글이 위로 오도록 생성일(createdAt) 기준으로 정렬합니다.
        const sortedPosts = response.data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setPosts(sortedPosts);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialPosts();
  }, []);

  const handleViewPost = (postId: string) => {
    setSelectedPostId(postId);
  };

  const handleCloseModal = () => {
    setSelectedPostId(null);
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* --- Recent Posts Section --- */}
      {/* Recent Posts Section */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <ClipboardList className="w-5 h-5 text-blue-600" />
          <h2 className="text-gray-900">최신 동행 모집</h2>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <MainPostCardSkeleton key={index} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            최신 게시글이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 최신 6개의 게시글만 보여줍니다. */}
            {posts.slice(0, 6).map((post) => (
              <MainPostCard
                key={post.id}
                post={post}
                onClick={() => handleViewPost(post.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* --- Region Categories Section --- */}
      {/* Region Categories */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h2 className="text-gray-900">인기 여행지</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {REGION_CATEGORIES.map((region) => (
            <button
              key={region.id}
              onClick={() => onSearch({ location: region.name })}
              className="group relative aspect-[3/4] rounded-xl overflow-hidden hover:shadow-lg transition-all"
            >
              <ImageWithFallback
                src={region.image}
                alt={region.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="mb-1">{region.name}</h3>
                <p className="text-xs text-gray-200">{region.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* --- Floating Action Button --- */}
      {isLoggedIn && (
        <Button
          onClick={onCreatePost}
          className="fixed bottom-12 right-12 z-40 flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-8 text-base font-bold text-white shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 hover:bg-blue-700 hover:shadow-2xl"
          aria-label="게시물 작성"
        >
          <Plus className="h-5 w-5" />
          여행 떠나기
        </Button>
      )}

      {/* --- Post Detail Modal --- */}
      <Dialog open={!!selectedPostId} onOpenChange={handleCloseModal}>
        <DialogContent className="w-full !max-w-[1100px] h-[90vh] p-0 flex flex-col [&>button]:hidden border-0 rounded-lg overflow-hidden">
          {selectedPostId && (
            <PostDetail
              postId={selectedPostId}
              onOpenChange={handleCloseModal}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
