import { useState, useEffect } from 'react';
import { MapPin, ClipboardList, Plus } from 'lucide-react'; // Plus 아이콘 추가
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import client from '../api/client';
import { type Post } from '../types/post';
import { MainPostCardSkeleton } from './MainPostCardSkeleton';
import { WorkspaceCarousel } from './WorkspaceCarousel';
import { useAuthStore } from '../store/authStore'; // Import useAuthStore

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
}: MainPageProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userPosts, setUserPosts] = useState<Post[]>([]); // New state for user's posts
  const [userPostsLoading, setUserPostsLoading] = useState(true); // New state for user's posts loading
  const { user, isAuthLoading } = useAuthStore(); // Get user and isAuthLoading from auth store

  useEffect(() => {
    // isAuthLoading이 true일 때는 API 호출을 하지 않습니다.
    if (isAuthLoading) {
      return;
    }

    const fetchInitialPosts = async () => {
      setIsLoading(true);
      try {
        const response = await client.get<Post[]>('/posts');
        // 최신 글이 위로 오도록 생성일(createdAt) 기준으로 정렬합니다.
        const sortedPosts = response.data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        console.log(`최신 동행 글 목록`, sortedPosts);
        setPosts(sortedPosts);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUserPosts = async () => {
      if (!isLoggedIn || !user?.userId) {
        setUserPostsLoading(false);
        return;
      }

      setUserPostsLoading(true);
      try {
        const response = await client.get<Post[]>(`/posts/user/${user.userId}`);
        const sortedUserPosts = response.data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        console.log(`${user.profile.nickname}님이 참여중인 여행`, sortedUserPosts);
        setUserPosts(sortedUserPosts);
      } catch (error) {
        console.error('Failed to fetch user posts:', error);
      } finally {
        setUserPostsLoading(false);
      }
    };

    fetchInitialPosts();
    fetchUserPosts(); // Call the new fetch function
  }, [isLoggedIn, user?.userId, user?.profile.nickname, isAuthLoading]); // Add isAuthLoading to dependency array

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50">
      {/* --- User's Participating Trips Section --- */}
      {isLoggedIn && user && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">{user.profile.nickname}님이 참여중인 여행</h2>
          </div>
          {userPostsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
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
          <h2 className="text-xl font-bold text-gray-900">최신 동행 모집</h2>
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
