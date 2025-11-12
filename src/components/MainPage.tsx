import { useState, useEffect } from 'react';
import { MapPin, ClipboardList, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import client from '../api/client';
import { type Post } from '../types/post';
import { MainPostCardSkeleton } from './MainPostCardSkeleton';
import { WorkspaceCarousel } from './WorkspaceCarousel';
import { useAuthStore } from '../store/authStore';

interface MainPageProps {
  onSearch: (params: {
    startDate?: string;
    endDate?: string;
    location?: string;
    title?: string;
  }) => void;
  onViewPost: (postId: string) => void;
  onCreatePost: () => void;
  isLoggedIn: boolean;
  fetchTrigger: number;
}

const REGION_CATEGORIES = [
  {
    id: 1,
    name: '제주도',
    image:
      'https://images.unsplash.com/photo-1614088459293-5669fadc3448?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHx0cmF2ZWwlMjBkZXN0aW5hdGlvbnxlbnwxfHx8fDE3NjE4NjQwNzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    description: '힐링 여행의 성지',
  },
  {
    id: 2,
    name: '부산',
    image:
      'https://images.unsplash.com/photo-1665231342828-229205867d94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxiZWFjaCUyMHBhcmFhZGlzZfGVufDF8fHx8MTc2MTg4Mzg2MHww&ixlib=rb-4.1.0&q=80&w=1080',
    description: '바다와 도시의 조화',
  },
  {
    id: 3,
    name: '서울',
    image:
      'https://images.unsplash.com/photo-1597552661064-af143a5f3bee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxzZW91bCUyMGtvcmVhfGVufDF8fHx8MTc2MTk4MjQzNHww&ixlib=rb-4.1.0&q=80&w=1080',
    description: '트렌디한 도심 여행',
  },
  {
    id: 4,
    name: '경주',
    image:
      'https://images.unsplash.com/photo-1668850443435-c01eec56c4e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxnYnllb25namUlMjBrb3JlYXxlbnwxfHx8fDE3NjE5ODI0MzR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    description: '역사 문화 탐방',
  },
  {
    id: 5,
    name: '강릉',
    image:
      'https://images.unsplash.com/photo-1684042229029-8a99193a8e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxnYW5nbmV1bmclMjBrb3JlYXxlbnwxfHx8fDE3NjE5ODI0MzV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    description: '동해안의 낭만',
  },
  {
    id: 6,
    name: '전주',
    image:
      'https://images.unsplash.com/photo-1520645521318-f03a12f0e67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxjaXR5JTIwdHJhdmVsfGVufDF8fHx8MTc2MTkxMjEzMXww&ixlib=rb-4.1.0&q=80&w=1080',
    description: '맛집 투어의 메카',
  },
];

export function MainPage({
  onSearch,
  onViewPost,
  onCreatePost,
  isLoggedIn,
  fetchTrigger,
}: MainPageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Single loading state for both sections
  const { user, isAuthLoading } = useAuthStore(); // Get user and isAuthLoading from auth store

  useEffect(() => {
    // isAuthLoading이 true일 때는 API 호출을 하지 않습니다.
    // user 정보가 완전히 로드될 때까지 기다립니다.
    if (isAuthLoading) {
      setIsLoading(true); // 인증 정보 로딩 중에는 전체 페이지 로딩 상태 유지
      return;
    }

    const fetchAllPosts = async () => {
      setIsLoading(true);
      try {
        const [initialPostsResponse, userPostsResponse] = await Promise.all([
          client.get<Post[]>('/posts'),
          isLoggedIn && user?.userId
            ? client.get<Post[]>(`/posts/user/${user.userId}`)
            : Promise.resolve({ data: [] }), // If not logged in or userId not available, resolve with empty array
        ]);

        // 전체 글 목록: 최신순으로 정렬
        const sortedInitialPosts = initialPostsResponse.data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // '최신 동행 모집' 섹션에는 '모집중'인 글만 필터링하여 설정
        const recruitingPosts = sortedInitialPosts.filter(post => post.status === '모집중');
        setPosts(recruitingPosts);
        console.log(`최신 동행 글 목록`, sortedInitialPosts);

        if (isLoggedIn && user?.userId) {
          const sortedUserPosts = userPostsResponse.data.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setUserPosts(sortedUserPosts);
          console.log(`${user.profile.nickname}님이 참여중인 여행`, sortedUserPosts);
        } else {
          setUserPosts([]);
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setIsLoading(false);
      }
    };


    fetchAllPosts();
  }, [
    isLoggedIn,
    user?.userId,
    user?.profile.nickname,
    isAuthLoading,
    fetchTrigger,
  ]); // Add fetchTrigger to dependency array
  
  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50">
      {/* --- User's Participating Trips Section --- */}
      {isLoggedIn && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {isLoading ? (
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
              ) : (
                // user?.profile.nickname은 isLoading이 false일 때 안전하게 접근 가능
                `${user?.profile.nickname}님이 참여중인 여행`
              )}
            </h2>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <MainPostCardSkeleton key={index} />
              ))}
            </div>
          ) : userPosts.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              참여중인 게시글이 없습니다.
            </div>
          ) : (
            <WorkspaceCarousel
              posts={userPosts}
              onCardClick={(post) => onViewPost(post.id)}
            />
          )}
        </section>
      )}

      {/* --- Recent Posts Section --- */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <MainPostCardSkeleton key={index} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            최신 게시글이 없습니다.
          </div>
        ) : (
          <WorkspaceCarousel
            posts={posts}
            onCardClick={(post) => onViewPost(post.id)}
          />
        )}
      </section>

      {/* --- Region Categories Section --- */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">인기 여행지</h2>
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

      {isLoggedIn && (
        <Button
          onClick={onCreatePost}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center z-40"
          aria-label="게시글 작성"
        >
          <Plus className="w-6 h-6 text-white" />
        </Button>
      )}
    </div>
  );
}
