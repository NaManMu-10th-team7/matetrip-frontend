import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from './ui/dialog';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import {
  X,
  Thermometer,
  Car,
  Pencil,
  Award,
  Star,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge } from './ui/badge';
import client from '../api/client'; // prettier-ignore
import { useAuthStore } from '../store/authStore';
import { type Post } from '../types/post';
import { type UserProfile as UserProfileType } from '../types/user';
import { translateKeyword } from '../utils/keyword';
import { WorkspaceCard } from './WorkspaceCard';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  onViewPost: (postId: string) => void;
}

interface UserProfile extends UserProfileType {
  profileImageId?: string | null;
  profileImage?: string | null;
}

interface Review {
  id: number;
  reviewer: {
    id: string;
    nickname: string;
    profileImage: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

export function ProfileModal({
  open,
  onOpenChange,
  userId,
  onViewPost,
}: ProfileModalProps) {
  const { user: loggedInUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [travelHistory, setTravelHistory] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  const isCurrentUser = loggedInUser?.userId === userId;

  const fetchProfileData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const [
        profileRes,
        writtenPostsRes,
        participatedPostsRes,
        // reviewsRes, // TODO: 리뷰 API 연동
      ] = await Promise.all([
        client.get<UserProfile>(`/users/${userId}/profile`),
        client.get<Post[]>(`/users/${userId}/posts`),
        client.get<Post[]>(`/users/${userId}/participations`),
        // client.get(`/users/${userId}/reviews`),
      ]);

      setProfile(profileRes.data);

      // 작성한 동행과 참여한 동행 목록을 합치고 중복을 제거합니다.
      const written = writtenPostsRes.data || [];
      const participated = participatedPostsRes.data || [];
      const combinedPosts = [...written, ...participated];

      // ID를 기준으로 중복을 제거하고, 최신순(createdAt)으로 정렬합니다.
      const uniquePosts = Array.from(
        new Map(combinedPosts.map((post) => [post.id, post])).values()
      ).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setTravelHistory(uniquePosts);
      // setReviews(reviewsRes.data);

      // --- Mock Review Data ---
      setReviews([
        {
          id: 1,
          reviewer: {
            id: '2',
            nickname: '김민수',
            profileImage:
              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
          },
          rating: 5,
          comment: '매우 친절하고 계획적인 여행 메이트였습니다!',
          createdAt: '2024-03-20',
        },
        {
          id: 2,
          reviewer: {
            id: '3',
            nickname: '이지은',
            profileImage:
              'https://images.unsplash.com/photo-1557053910-d9eadeed1c58',
          },
          rating: 4,
          comment: '함께 여행하기 좋은 분이었어요.',
          createdAt: '2024-04-25',
        },
      ]);
      // --- End Mock Data ---
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open && userId) {
      fetchProfileData();
    }
  }, [open, userId, fetchProfileData]);

  const handleEditProfile = () => {
    // TODO: 프로필 수정 모달 구현
    alert('프로필 수정 기능은 준비 중입니다.');
  };

  const handleCardClick = (post: Post) => {
    onViewPost(post.id); // 게시글 상세 보기로 이동
  };

  if (isLoading || !profile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <div className="flex items-center justify-center h-full">
            프로필 정보를 불러오는 중입니다...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl min-w-[900px] h-[80vh] p-0 overflow-hidden flex flex-col border-0"
        aria-describedby={undefined}
      >
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10 text-left">
          <DialogTitle className="text-gray-900">
            {profile.nickname}님의 프로필
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-50 no-scrollbar">
          {/* --- 프로필 상단 --- */}
          <div className="flex gap-6">
            <div className="flex-1 border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-6">
                  <ImageWithFallback
                    src={ // TODO: profileImageId를 presigned-url로 변환하는 로직 필요
                      profile.profileImage ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                    }
                    alt={profile.nickname}
                    className="w-24 h-24 rounded-full object-cover ring-2 ring-gray-100"
                  />
                  <div className="flex flex-col gap-2 pt-2">
                    <h3 className="text-gray-900 text-2xl font-bold">
                      {profile.nickname}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.travelStyles?.map((style) => (
                        <Badge key={style} variant="secondary">
                          {translateKeyword(style)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                {isCurrentUser && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 flex-shrink-0"
                    onClick={handleEditProfile}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    프로필 수정
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-gray-500 text-sm mb-1">매너온도</p>
                  <div className="flex items-center justify-center gap-1 text-blue-600 font-semibold">
                    <Thermometer className="w-4 h-4" />
                    <p>36.5°C</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-gray-500 text-sm mb-1">여행횟수</p>
                  <div className="flex items-center justify-center gap-1 font-semibold">
                    <Car className="w-4 h-4" />
                    <p>{travelHistory.length}회</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-gray-500 text-sm mb-1">인증 상태</p>
                  <p className="font-semibold text-green-600">
                    ✅ 본인인증 완료
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* --- 탭 메뉴 --- */}
          <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
            <div className="flex border-b border-gray-200">
              {[
                { key: 'overview', label: '소개' },
                { key: 'history', label: '여행 기록' },
                { key: 'reviews', label: '받은 리뷰' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={`flex-1 py-3 text-center transition-colors text-sm font-medium ${
                    activeTab === tab.key
                      ? 'border-b-2 border-gray-900 text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-gray-900 mb-2 font-bold">한줄 소개</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {profile.intro ||
                        '아직 한줄 소개가 작성되지 않았습니다.'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-2 font-bold">상세 소개</h4>
                    <div
                      className={`text-gray-700 leading-relaxed whitespace-pre-wrap ${
                        !isBioExpanded && 'line-clamp-3'
                      }`}
                    >
                      {profile.description || '아직 상세 소개가 작성되지 않았습니다.'}
                    </div>
                    {(profile.description?.split('\n').length > 3 ||
                      (profile.description && profile.description.length > 150)) && (
                      <button // 더보기/접기 버튼 조건 수정
                        onClick={() => setIsBioExpanded(!isBioExpanded)}
                        className="w-full mt-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        {isBioExpanded ? '접기' : '더보기'}
                        {isBioExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {travelHistory.length > 0 ? (
                    travelHistory.map((post) => (
                      <WorkspaceCard
                        key={post.id}
                        post={post}
                        onClick={() => handleCardClick(post)}
                      />
                    ))
                  ) : (
                    <p className="text-gray-500 col-span-2 text-center py-8">
                      여행 기록이 없습니다.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border-b border-gray-200 pb-4 last:border-b-0"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <ImageWithFallback
                              src={review.reviewer.profileImage}
                              alt={review.reviewer.nickname}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <span className="text-gray-900 font-medium">
                                {review.reviewer.nickname}
                              </span>
                              <div className="flex mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-gray-500 text-xs">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm ml-13">
                          {review.comment}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      받은 리뷰가 없습니다.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
