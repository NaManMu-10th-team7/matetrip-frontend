import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { PlaceRecommendationSection } from '../components/PlaceRecommendationSection';
import { InspirationCard } from '../components/InspirationCard';
import { PostDetail } from './PostDetail';
import { useAuthStore } from '../store/authStore';
import client, { API_BASE_URL } from '../api/client';
import { type Post } from '../types/post';
import { type PlaceDto, type CategoryCode } from '../types/place'; // CategoryCode 임포트
import type { MatchCandidateDto } from '../types/matching';
import { GridMatchingCard } from '../components/GridMatchingCard';
import { MainPostCardSkeleton } from '../components/AIMatchingSkeletion';

interface PopularPlaceResponse {
  addplace_id: string;
  title: string;
  address: string;
  image_url?: string;
  summary?: string;
  latitude: number;
  longitude: number;
}

interface Place {
  id: string;
  title: string;
  address: string;
  imageUrl?: string;
  summary?: string;
  latitude: number;
  longitude: number;
  category: CategoryCode; // category 필드 추가
}

interface NewMainPageProps {
  onCreatePost: () => void;
  onJoinWorkspace: (postId: string, workspaceName: string) => void;
  onViewProfile: (userId: string) => void;
  onEditPost: (post: Post) => void;
  onDeleteSuccess?: () => void;
}

type SelectedType = 'post' | 'place' | 'inspiration' | null;

// AIMatchingPage.tsx에서 가져온 헬퍼 함수들 (수정: 배열 반환)
const normalizeTextList = (values?: unknown): string[] => {
  if (!values) {
    return [];
  }

  const arrayValues = Array.isArray(values) ? values : [values];

  const normalized = arrayValues
    .map((value) => {
      if (!value) {
        return '';
      }
      if (typeof value === 'object') {
        const candidate = value as Record<string, unknown>;
        if (typeof candidate.label === 'string') {
          return candidate.label;
        }
        if (typeof candidate.value === 'string') {
          return candidate.value;
        }
        if (typeof candidate.name === 'string') {
          return candidate.name;
        }
      }
      return String(value);
    })
    .map((text) => text.trim())
    .filter((text) => text.length > 0);

  return normalized;
};

// normalizeOverlapText는 이제 사용하지 않음 (개별 키워드 배열로 전달)

export function NewMainPage({
  onJoinWorkspace,
  onViewProfile,
  onEditPost,
  onDeleteSuccess,
}: NewMainPageProps) {
  const navigate = useNavigate();
  const { user, isAuthLoading } = useAuthStore();
  const isLoggedIn = !!user;

  // Data states
  const [posts, setPosts] = useState<Post[]>([]);
  const [matches, setMatches] = useState<MatchCandidateDto[]>([]);
  const [inspirations, setInspirations] = useState<Place[]>([]);

  // Loading states
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [isMatchesLoading, setIsMatchesLoading] = useState(true);
  const [isInspirationsLoading, setIsInspirationsLoading] = useState(true);

  // Selection states
  const [selectedType, setSelectedType] = useState<SelectedType>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [_selectedPlace, setSelectedPlace] = useState<PlaceDto | null>(null);
  const [showPostDetailModal, setShowPostDetailModal] = useState(false);

  // 작성자 프로필 이미지 관리
  const [writerProfileImages, setWriterProfileImages] = useState<
    Record<string, string | null>
  >({});

  // Fetch all posts
  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const fetchPosts = async () => {
      setIsPostsLoading(true);
      try {
        const response = await client.get<Post[]>('/posts');
        const sorted = response.data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const recruiting = sorted.filter((post) => post.status === '모집중');
        setPosts(recruiting);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setIsPostsLoading(false);
      }
    };

    fetchPosts();
  }, [isAuthLoading]);

  // Fetch matching data (로그인 필요)
  useEffect(() => {
    if (isAuthLoading || !isLoggedIn || !user?.userId) {
      setIsMatchesLoading(false);
      return;
    }

    let isMounted = true;

    const fetchMatches = async () => {
      setIsMatchesLoading(true);
      try {
        const response = await client.post<MatchCandidateDto[]>(
          '/profile/matching/search',
          { limit: 5 }
        );
        if (!isMounted) return;
        setMatches(response.data ?? []);
      } catch (error) {
        if (!isMounted) return;
        console.error('Failed to fetch matches:', error);
      } finally {
        if (isMounted) {
          setIsMatchesLoading(false);
        }
      }
    };

    fetchMatches();

    return () => {
      isMounted = false;
    };
  }, [isAuthLoading, isLoggedIn, user?.userId]);

  // Fetch inspiration places
  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const fetchInspirations = async () => {
      setIsInspirationsLoading(true);
      try {
        const response = await client.get<PopularPlaceResponse[]>(
          '/places/popular',
          { params: { page: 1, limit: 5 } }
        );

        const detailedPlaces = await Promise.all(
          response.data.map(async (item) => {
            try {
              const detailResponse = await client.get(
                `/places/${item.addplace_id}`
              );

              return {
                id: item.addplace_id,
                title: item.title,
                address: item.address,
                imageUrl: item.image_url,
                summary: detailResponse.data.summary,
                latitude: detailResponse.data.latitude,
                longitude: detailResponse.data.longitude,
                category: detailResponse.data.category, // category 추가
              };
            } catch (error) {
              console.error(
                `Failed to fetch detail for ${item.addplace_id}:`,
                error
              );
              return {
                id: item.addplace_id,
                title: item.title,
                address: item.address,
                imageUrl: item.image_url,
                summary: undefined,
                latitude: 37.5665,
                longitude: 126.978,
                category: '기타', // 기본값 설정
              };
            }
          })
        );

        setInspirations(detailedPlaces);
      } catch (error) {
        console.error('Failed to fetch inspirations:', error);
      } finally {
        setIsInspirationsLoading(false);
      }
    };

    fetchInspirations();
  }, [isAuthLoading]);

  // Calculate matched posts with scores using useMemo
  const matchedPosts = useMemo(() => {
    return matches
      .map((match) => {
        const post = posts.find((p) => {
          const writerIds = [
            p.writerId,
            p.writer?.id,
            p.writerProfile?.id,
          ].filter(Boolean);
          return writerIds.includes(match.userId);
        });

        if (!post) return null;

        // normalizeTextList를 사용하여 배열로 전달
        const tendencyKeywords = normalizeTextList(match.overlappingTendencies);
        const styleKeywords = normalizeTextList(match.overlappingTravelStyles);

        return {
          post,
          score: Math.round(match.score * 100),
          tendency: tendencyKeywords, // 배열로 저장
          style: styleKeywords, // 배열로 저장
        };
      })
      .filter(
        (item): item is { post: Post; score: number; tendency: string[]; style: string[] } =>
          item !== null
      )
      .slice(0, 5);
  }, [matches, posts]);

  // 작성자 프로필 이미지 일괄 로드
  useEffect(() => {
    const fetchAllWriterProfileImages = async () => {
      const imageIds = matchedPosts
        .map((item) => item.post.writer?.profile?.profileImageId)
        .filter((id): id is string => id != null && id.length > 0);

      const uniqueImageIds = Array.from(new Set(imageIds));

      if (uniqueImageIds.length === 0) {
        setWriterProfileImages({});
        return;
      }

      try {
        const results = await Promise.all(
          uniqueImageIds.map(async (imageId) => {
            try {
              const response = await fetch(
                `${API_BASE_URL}/binary-content/${imageId}/presigned-url`,
                {
                  credentials: 'include',
                }
              );

              if (!response.ok) {
                throw new Error('프로필 이미지를 불러오지 못했습니다.');
              }

              const payload = await response.json();
              const { url } = payload;
              return { imageId, url };
            } catch (error) {
              console.error(`Failed to load profile image ${imageId}:`, error);
              return { imageId, url: null };
            }
          })
        );

        const imageMap: Record<string, string | null> = {};
        results.forEach(({ imageId, url }) => {
          imageMap[imageId] = url;
        });
        setWriterProfileImages(imageMap);
      } catch (error) {
        console.error('Failed to fetch writer profile images:', error);
      }
    };

    if (matchedPosts.length > 0) {
      fetchAllWriterProfileImages();
    } else {
      setWriterProfileImages({});
    }
  }, [matchedPosts]);

  // Handlers
  const handlePostClick = (postId: string) => {
    console.log('🟢 handlePostClick 호출됨!', {
      postId,
      isLoggedIn,
      현재상태: { selectedType, selectedId },
    });
    setSelectedType('post');
    setSelectedId(postId);
    console.log('🟢 State 설정 완료:', {
      새로운상태: { selectedType: 'post', selectedId: postId },
    });
  };

  const handlePlaceClick = (placeId: string, place: PlaceDto) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setSelectedType('place');
    setSelectedId(placeId);
    setSelectedPlace(place);
  };

  const handleInspirationClick = (place: Place) => {
    setSelectedType('inspiration');
    setSelectedId(place.id);
    const placeDto: PlaceDto = {
      id: place.id,
      category: place.category, // place.category 사용
      title: place.title,
      address: place.address,
      summary: place.summary,
      image_url: place.imageUrl,
      longitude: place.longitude,
      latitude: place.latitude,
    };
    setSelectedPlace(placeDto);
  };

  const handleAllViewMatching = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    navigate('/ai-matching');
  };

  const handleAllViewInspiration = () => {
    navigate('/inspiration');
  };

  return (
    <div className="flex h-full bg-white relative">
      {/* Center Content */}
      <div className="flex-1 overflow-y-auto px-8 md:px-16 lg:px-24 py-6 md:py-8 lg:py-12">
        {/* Section 1: AI 추천 동행 (유저-게시글 매칭) */}
        <section className="mb-8 md:mb-10 lg:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
            <div>
              <h2 className="text-xl md:text-xl font-bold text-gray-900">
                {user?.profile.nickname}님의 성향에 맞을 수도 있는 동행의
                여행일정
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                MateTrip AI가 추천하는 최적의 여행 파트너
              </p>
            </div>
            <Button
              onClick={handleAllViewMatching}
              variant="ghost"
              className="text-sm self-start sm:self-auto"
            >
              View All
            </Button>
          </div>

          {(() => {
            console.log('🎯 Section 1 렌더링 조건:', {
              isLoggedIn,
              isMatchesLoading,
              isPostsLoading,
              matchedPostsLength: matchedPosts.length,
              렌더링할내용: !isLoggedIn
                ? '로그인 필요'
                : isMatchesLoading || isPostsLoading
                  ? '로딩 중'
                  : matchedPosts.length === 0
                    ? '추천 없음'
                    : '카드 렌더링',
            });
            return null;
          })()}
          {!isLoggedIn ? (
            <div className="bg-gradient-to-r from-blue-50 to-pink-50 rounded-2xl p-6 border border-blue-100">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  로그인이 필요합니다
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  당신에게 딱 맞는 동행을 AI가 추천해드려요
                </p>
                <Button
                  onClick={() => navigate('/login')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  로그인하기
                </Button>
              </div>
            </div>
          ) : isMatchesLoading || isPostsLoading ? (
            <div className="grid grid-cols-5 gap-4 md:gap-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <MainPostCardSkeleton key={index} />
              ))}
            </div>
          ) : matchedPosts.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              추천할 동행이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-4 md:gap-6">
              {matchedPosts.map(({ post, score, tendency, style }, index) => {
                // tendency와 style을 string[]에서 string으로 변환
                const formattedTendency = tendency.join(', ');
                const formattedStyle = style.join(', ');

                return (
                  <GridMatchingCard
                    key={post.id}
                    post={post}
                    matchingInfo={{
                      score: score,
                      tendency: formattedTendency, // 변환된 string 사용
                      style: formattedStyle,       // 변환된 string 사용
                    }}
                    rank={index + 1}
                    writerProfileImageUrl={
                      post.writer?.profile?.profileImageId
                        ? (writerProfileImages[
                            post.writer.profile.profileImageId
                          ] ?? null)
                        : null
                    }
                    writerNickname={post.writer?.profile?.nickname ?? null}
                    onClick={() => handlePostClick(post.id)}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: 장소 추천 */}
        <PlaceRecommendationSection onPlaceClick={handlePlaceClick} />

        {/* Section 3: Inspiration */}
        <section className="mb-8 md:mb-10 lg:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
            <div>
              <h2 className="text-xl md:text-xl font-bold text-gray-900">
                Hot Place
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mt-1text-xs md:text-sm text-gray-600 mt-1">
                MateTrip 유저들의 Pick!
              </p>
            </div>
            <Button
              onClick={handleAllViewInspiration}
              variant="ghost"
              className="text-sm self-start sm:self-auto"
            >
              View All
            </Button>
          </div>

          {isInspirationsLoading ? (
            <div className="grid grid-cols-5 gap-4 md:gap-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="w-full h-64 bg-gray-200 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : inspirations.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              추천할 장소가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-4 md:gap-6">
              {inspirations.map((place, index) => (
                <InspirationCard
                  key={place.id}
                  imageUrl={place.imageUrl}
                  title={place.title}
                  address={place.address}
                  category={place.category}
                  summary={place.summary}
                  rank={index + 1} // rank prop 추가
                  // badgeText={`현재 가장 인기있는 장소 TOP. ${index + 1}`} // badgeText 제거
                  onClick={() => handleInspirationClick(place)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* PostDetail Modal - 전체 상세보기 */}
      {showPostDetailModal && selectedId && (
        <PostDetail
          postId={selectedId}
          onJoinWorkspace={onJoinWorkspace}
          onViewProfile={onViewProfile}
          onEditPost={onEditPost}
          onDeleteSuccess={onDeleteSuccess || (() => {})}
          onOpenChange={(open) => {
            setShowPostDetailModal(open);
            if (!open) {
              setSelectedType(null);
              setSelectedId(null);
            }
          }}
        />
      )}
    </div>
  );
}
