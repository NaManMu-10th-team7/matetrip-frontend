import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react'; // [신규] MapPin 아이콘 임포트
import { Button } from '../components/ui/button';
import { PlaceRecommendationSection } from '../components/PlaceRecommendationSection';
import { InspirationCard } from '../components/InspirationCard';
import { PostDetail } from './PostDetail';
import { useAuthStore } from '../store/authStore';
import client, { API_BASE_URL } from '../api/client';
import { type Post } from '../types/post';
import { type CategoryCode } from '../types/place';
import type { MatchCandidateDto } from '../types/matching';
import { GridMatchingCard } from '../components/GridMatchingCard';
import { MainPostCardSkeleton } from '../components/AIMatchingSkeletion';
import { PoiDetailPanel } from '../components/ScheduleSidebar';
import PageContainer from '../components/PageContainer';
import { CategoryIcon } from '../components/CategoryIcon';

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
  category: CategoryCode;
}

interface ReviewablePlaceInfo {
  id: string;
  title: string;
  address: string;
  region: string;
  latitude: number;
  longitude: number;
  category: string;
  image_url: string;
  tags: string[];
  summary: string;
  sido: string;
  createdAt: string;
  planDate: string;
}

interface ReviewableTrip {
  post: {
    id: string;
    title: string;
  };
  places: ReviewablePlaceInfo[];
}

interface NewMainPageProps {
  onCreatePost: () => void;
  onJoinWorkspace: (postId: string, workspaceName:string) => void;
  onViewProfile: (userId: string) => void;
  onEditPost: (post: Post) => void;
  onDeleteSuccess?: () => void;
}

const normalizeTextList = (values?: unknown): string[] => {
  if (!values) return [];
  const arrayValues = Array.isArray(values) ? values : [values];
  return arrayValues
    .map((value) => {
      if (!value) return '';
      if (typeof value === 'object') {
        const candidate = value as Record<string, unknown>;
        if (typeof candidate.label === 'string') return candidate.label;
        if (typeof candidate.value === 'string') return candidate.value;
        if (typeof candidate.name === 'string') return candidate.name;
      }
      return String(value);
    })
    .map((text) => text.trim())
    .filter((text) => text.length > 0);
};

// [수정] ReviewablePlaceCard에 주소 표시 추가
function ReviewablePlaceCard({
  place,
  onClick,
}: {
  place: ReviewablePlaceInfo;
  onClick: () => void;
}) {
  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-xl shadow-md transition-shadow hover:shadow-lg"
      onClick={onClick}
    >
      <img
        src={place.image_url || 'https://via.placeholder.com/300x200'}
        alt={place.title}
        className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-0 left-0 p-3 w-full">
        <h3 className="text-md font-bold text-white truncate">{place.title}</h3>
        <div className="flex items-center gap-1 text-xs text-gray-200 mt-1">
          <CategoryIcon category={place.category} className="w-3 h-3" />
          <span>{place.category}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-200 mt-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <p className="truncate">{place.address}</p>
        </div>
      </div>
    </div>
  );
}

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
  const [reviewableTrips, setReviewableTrips] = useState<ReviewableTrip[]>([]);

  // Loading states
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [isMatchesLoading, setIsMatchesLoading] = useState(true);
  const [isInspirationsLoading, setIsInspirationsLoading] = useState(true);
  const [isReviewablePlacesLoading, setIsReviewablePlacesLoading] =
    useState(true);

  const [activeReviewTabs, setActiveReviewTabs] = useState<
    Record<string, string>
  >({});

  // Panel/Modal states
  const [showPlaceDetailPanel, setShowPlaceDetailPanel] = useState(false);
  const [selectedPlaceIdForPanel, setSelectedPlaceIdForPanel] = useState<
    string | null
  >(null);
  const [showPostDetailPanel, setShowPostDetailPanel] = useState(false);
  const [selectedPostIdForPanel, setSelectedPostIdForPanel] = useState<
    string | null
  >(null);

  const [writerProfileImages, setWriterProfileImages] = useState<
    Record<string, string | null>
  >({});

  // Fetch all posts
  useEffect(() => {
    if (isAuthLoading) return;
    const fetchPosts = async () => {
      setIsPostsLoading(true);
      try {
        const response = await client.get<Post[]>('/posts');
        const sorted = response.data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setPosts(sorted.filter((post) => post.status === '모집중'));
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
        if (isMounted) setMatches(response.data ?? []);
      } catch (error) {
        if (isMounted) console.error('Failed to fetch matches:', error);
      } finally {
        if (isMounted) setIsMatchesLoading(false);
      }
    };
    fetchMatches();
    return () => {
      isMounted = false;
    };
  }, [isAuthLoading, isLoggedIn, user?.userId]);

  // Fetch inspiration places
  useEffect(() => {
    if (isAuthLoading) return;
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
              const place: Place = {
                id: item.addplace_id,
                title: item.title,
                address: item.address,
                imageUrl: item.image_url,
                summary: detailResponse.data.summary,
                latitude: detailResponse.data.latitude,
                longitude: detailResponse.data.longitude,
                category: detailResponse.data.category,
              };
              return place;
            } catch (error) {
              console.error(
                `Failed to fetch detail for ${item.addplace_id}:`,
                error
              );
              return null;
            }
          })
        );
        setInspirations(detailedPlaces.filter((p): p is Place => p !== null));
      } catch (error) {
        console.error('Failed to fetch inspirations:', error);
      } finally {
        setIsInspirationsLoading(false);
      }
    };
    fetchInspirations();
  }, [isAuthLoading]);

  // Fetch reviewable places and initialize tabs
  useEffect(() => {
    if (!isLoggedIn) {
      setIsReviewablePlacesLoading(false);
      return;
    }
    const fetchReviewablePlaces = async () => {
      setIsReviewablePlacesLoading(true);
      try {
        const response = await client.get<ReviewableTrip[]>(
          '/place-user-reviews/reviewable'
        );
        const trips = response.data ?? [];
        setReviewableTrips(trips);

        if (trips.length > 0) {
          const initialTabs: Record<string, string> = {};
          trips.forEach((trip) => {
            if (trip.places.length > 0) {
              const firstDate = trip.places.reduce((earliest, current) => {
                return earliest < current.planDate ? earliest : current.planDate;
              }, trip.places[0].planDate);
              initialTabs[trip.post.id] = firstDate;
            }
          });
          setActiveReviewTabs(initialTabs);
        }
      } catch (error) {
        console.error('Failed to fetch reviewable places:', error);
        setReviewableTrips([]);
      } finally {
        setIsReviewablePlacesLoading(false);
      }
    };
    fetchReviewablePlaces();
  }, [isLoggedIn]);

  const matchedPosts = useMemo(() => {
    return matches
      .map((match) => {
        const post = posts.find((p) =>
          [p.writerId, p.writer?.id, p.writerProfile?.id]
            .filter(Boolean)
            .includes(match.userId)
        );
        if (!post) return null;
        return {
          post,
          score: Math.round(match.score * 100),
          tendency: normalizeTextList(match.overlappingTendencies),
          style: normalizeTextList(match.overlappingTravelStyles),
        };
      })
      .filter(
        (
          item
        ): item is {
          post: Post;
          score: number;
          tendency: string[];
          style: string[];
        } => item !== null
      )
      .slice(0, 5);
  }, [matches, posts]);

  useEffect(() => {
    const fetchAllWriterProfileImages = async () => {
      const imageIds = matchedPosts
        .map((item) => item.post.writer?.profile?.profileImageId)
        .filter((id): id is string => !!id);
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
                { credentials: 'include' }
              );
              if (!response.ok)
                throw new Error('Failed to fetch presigned URL');
              const { url } = await response.json();
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
    if (matchedPosts.length > 0) fetchAllWriterProfileImages();
    else setWriterProfileImages({});
  }, [matchedPosts]);

  const handleOpenPlaceDetailPanel = (placeId: string) => {
    setSelectedPlaceIdForPanel(placeId);
    requestAnimationFrame(() => setShowPlaceDetailPanel(true));
  };

  const handleClosePlaceDetailPanel = () => {
    setShowPlaceDetailPanel(false);
    setTimeout(() => setSelectedPlaceIdForPanel(null), 300);
  };

  const handleOpenPostDetailPanel = (postId: string) => {
    setSelectedPostIdForPanel(postId);
    setShowPostDetailPanel(true);
  };

  const handleClosePostDetailPanel = () => {
    setShowPostDetailPanel(false);
    setSelectedPostIdForPanel(null);
  };

  const handlePostClick = (postId: string) => {
    handleOpenPostDetailPanel(postId);
  };

  const handlePlaceClick = (placeId: string) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    handleOpenPlaceDetailPanel(placeId);
  };

  const handleInspirationClick = (place: Place) => {
    handleOpenPlaceDetailPanel(place.id);
  };

  const handleAllViewMatching = () => {
    if (!isLoggedIn) navigate('/login');
    else navigate('/ai-matching');
  };

  const handleAllViewInspiration = () => {
    navigate('/inspiration');
  };

  return (
    <div className="flex bg-white relative">
      <div className="flex-1 overflow-y-auto">
        <PageContainer className="flex flex-col gap-y-8 md:gap-y-10 lg:gap-y-12">
          {/* Section 1: AI 추천 동행 */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
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
            {!isLoggedIn ? (
              <div className="bg-gradient-to-r from-blue-50 to-pink-50 rounded-2xl p-6 border border-blue-100 text-center">
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
                {matchedPosts.map(({ post, score, tendency, style }, index) => (
                  <GridMatchingCard
                    key={post.id}
                    post={post}
                    matchingInfo={{
                      score,
                      tendency: tendency.join(', '),
                      style: style.join(', '),
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
                ))}
              </div>
            )}
          </section>

          {/* Section: 리뷰 가능한 장소 (탭 UI 적용) */}
          {isLoggedIn && (
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {user?.profile.nickname}님의 리뷰를 기다리는 장소
                  </h2>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                    다녀오신 장소에 대한 리뷰를 남겨주세요!
                  </p>
                </div>
              </div>
              {isReviewablePlacesLoading ? (
                <div className="space-y-4">
                  <div className="h-8 w-1/3 bg-gray-200 rounded animate-pulse" />
                  <div className="grid grid-cols-5 gap-4 md:gap-6">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="w-full h-40 bg-gray-200 rounded-xl animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              ) : reviewableTrips.length === 0 ? (
                <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg">
                  리뷰를 작성할 장소가 없습니다.
                </div>
              ) : (
                <div className="flex flex-col gap-y-8">
                  {reviewableTrips.map((trip) => {
                    const placesByDate = trip.places.reduce(
                      (acc, place) => {
                        const date = place.planDate;
                        if (!acc[date]) {
                          acc[date] = [];
                        }
                        acc[date].push(place);
                        return acc;
                      },
                      {} as Record<string, ReviewablePlaceInfo[]>
                    );

                    const sortedDates = Object.keys(placesByDate).sort();
                    const activeDate = activeReviewTabs[trip.post.id];

                    return (
                      <div key={trip.post.id}>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                          <span className="text-blue-600">
                            "{trip.post.title}"
                          </span>{' '}
                          여행
                        </h3>
                        <div className="border-b border-gray-200">
                          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            {sortedDates.map((date) => (
                              <button
                                key={date}
                                type="button"
                                onClick={() =>
                                  setActiveReviewTabs((prev) => ({
                                    ...prev,
                                    [trip.post.id]: date,
                                  }))
                                }
                                className={`${
                                  date === activeDate
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                              >
                                {date}
                              </button>
                            ))}
                          </nav>
                        </div>
                        <div className="grid grid-cols-5 gap-4 md:gap-6 pt-6">
                          {activeDate &&
                            placesByDate[activeDate]?.map((place) => (
                              <ReviewablePlaceCard
                                key={place.id}
                                place={place}
                                onClick={() => handlePlaceClick(place.id)}
                              />
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Section 2: 장소 추천 */}
          <PlaceRecommendationSection onPlaceClick={handlePlaceClick} />

          {/* Section 3: Inspiration */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Hot Place</h2>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
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
                    rank={index + 1}
                    onClick={() => handleInspirationClick(place)}
                  />
                ))}
              </div>
            )}
          </section>
        </PageContainer>
      </div>

      {/* Panels & Overlay */}
      <div
        className={`fixed inset-0 z-20 bg-black/50 transition-opacity duration-300 ${
          showPlaceDetailPanel || showPostDetailPanel
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => {
          if (showPlaceDetailPanel) handleClosePlaceDetailPanel();
          if (showPostDetailPanel) handleClosePostDetailPanel();
        }}
      />
      <PoiDetailPanel
        placeId={selectedPlaceIdForPanel}
        isVisible={showPlaceDetailPanel}
        onClose={handleClosePlaceDetailPanel}
        onNearbyPlaceSelect={handleOpenPlaceDetailPanel}
        onPoiSelect={() => {}}
        widthClass="w-1/2"
        onClick={(e) => e.stopPropagation()}
        positioning="fixed"
      />
      <div
        className={`fixed right-0 top-0 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-30 ${
          showPostDetailPanel ? 'translate-x-0' : 'translate-x-full'
        } w-1/2`}
        onClick={(e) => e.stopPropagation()}
      >
        {selectedPostIdForPanel && (
          <PostDetail
            postId={selectedPostIdForPanel}
            onJoinWorkspace={(postId, workspaceName) => {
              onJoinWorkspace(postId, workspaceName);
              handleClosePostDetailPanel();
            }}
            onViewProfile={onViewProfile}
            onEditPost={onEditPost}
            onDeleteSuccess={onDeleteSuccess || (() => {})}
            onOpenChange={handleClosePostDetailPanel}
          />
        )}
      </div>
    </div>
  );
}
