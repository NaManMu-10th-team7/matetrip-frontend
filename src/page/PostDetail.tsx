import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, // ChevronLeft 아이콘으로 변경
  MapPin,
  Calendar,
  Users,
  Thermometer,
  Trash2,
  MoreVertical,
  Pencil,
  Megaphone,
  Check,
  X,
  FileText,
  UserCheck,
  UserPlus,
  DoorOpen, // DoorOpen 아이콘 추가
  AlertTriangle,
} from 'lucide-react';
import React from 'react'; // Import React to use React.ReactNode
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import client from '../api/client';
import { type Post, type Participation } from '../types/post';
import { translateKeyword } from '../utils/keyword';
import { useAuthStore } from '../store/authStore';
import { PostDetailSkeleton } from './PostDetailSkeleton';
import { toast } from 'sonner';

interface PostDetailProps {
  postId: string;
  onJoinWorkspace: (postId: string, workspaceName: string) => void;
  onViewProfile: (userId: string) => void;
  onEditPost: (post: Post) => void;
  onOpenChange: (open: boolean) => void;
  onDeleteSuccess: () => void; // 삭제 성공 시 호출될 콜백
}

type ProfileWithMannerTemperature = {
  mannerTemperature?: number | null;
  mannerTemp?: number | null;
};

const formatMannerTemperature = (
  profile?: ProfileWithMannerTemperature | null
) => {
  const raw = profile?.mannerTemperature ?? profile?.mannerTemp ?? null;
  const parsed =
    typeof raw === 'number' ? raw : raw != null ? Number(raw) : null;

  return typeof parsed === 'number' && Number.isFinite(parsed)
    ? `${parsed.toFixed(1)}°C`
    : '정보 없음';
};

export function PostDetail({
  postId,
  onJoinWorkspace,
  onViewProfile,
  onEditPost,
  onOpenChange,
  onDeleteSuccess,
}: PostDetailProps) {
  const [remoteCoverImageUrl, setRemoteCoverImageUrl] = useState<string | null>(
    null
  );
  const { user } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Participation[]>([]);
  const [approvedParticipants, setApprovedParticipants] = useState<
    Participation[]
  >([]);
  const [writerProfileImageUrl, setWriterProfileImageUrl] = useState<
    string | null
  >(null);
  const [participantProfileUrls, setParticipantProfileUrls] = useState<
    Record<string, string | null>
  >({});
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [showDeleteSuccessAlert, setShowDeleteSuccessAlert] = useState(false);
  const [activeTab, setActiveTab] = useState('intro'); // 탭 상태 관리
  const [recommendedUserProfiles, setRecommendedUserProfiles] = useState<
    Record<
      string,
      {
        nickname: string;
        imageUrl?: string | null;
      } | null
    >
  >({});
  const [invitedUserIds, setInvitedUserIds] = useState<Set<string>>(new Set());

  const fetchPostDetail = useCallback(async () => {
    if (!postId) return;
    setIsLoading(true);
    setError(null);
    try {
      const postResponse = await client.get<Post>(`/posts/${postId}`);
      const fetchedPost = postResponse.data;
      setPost(fetchedPost);
      if (fetchedPost.imageId) {
        try {
          const payload = await client.get<{ url: string }>(
            `/binary-content/${fetchedPost.imageId}/presigned-url`
          );
          setRemoteCoverImageUrl(payload.data.url);
        } catch (imageErr) {
          // console.error('Post detail cover image load failed:', imageErr);
          setRemoteCoverImageUrl(null);
        }
      } else {
        setRemoteCoverImageUrl(null);
      }

      const allParticipations = fetchedPost.participations || [];
      setParticipations(allParticipations);
      setApprovedParticipants(
        allParticipations.filter((p) => p.status === '승인')
      );
      setPendingRequests(
        allParticipations.filter((p) => p.status === '대기중')
      );
    } catch (err) {
      setError(err as Error);
      // console.error('Failed to fetch post details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPostDetail();
  }, [fetchPostDetail]);

  useEffect(() => {
    let cancelled = false;
    const profileImageId = post?.writer?.profile?.profileImageId;

    if (!profileImageId) {
      setWriterProfileImageUrl(null);
      return;
    }

    (async () => {
      try {
        const { data } = await client.get<{ url: string }>(
          `/binary-content/${profileImageId}/presigned-url`
        );
        if (!cancelled) {
          setWriterProfileImageUrl(data.url);
        }
      } catch (err) {
        // console.error('PostDetail writer image load failed:', err);
        if (!cancelled) {
          setWriterProfileImageUrl(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [post?.writer?.profile?.profileImageId]);

  useEffect(() => {
    let cancelled = false;
    const imageIds = participations
      .map((p) => p.requester.profile?.profileImageId)
      .filter((id): id is string => Boolean(id));

    if (!imageIds.length) {
      setParticipantProfileUrls({});
      return;
    }

    const uniqueIds = Array.from(new Set(imageIds));

    (async () => {
      try {
        const results = await Promise.all(
          uniqueIds.map(async (imageId) => {
            try {
              const { data } = await client.get<{ url: string }>(
                `/binary-content/${imageId}/presigned-url`
              );
              return { imageId, url: data.url };
            } catch (err) {
              // console.error('PostDetail participant image load failed:', err);
              return { imageId, url: null };
            }
          })
        );
        if (cancelled) {
          return;
        }
        const nextMap: Record<string, string | null> = {};
        for (const { imageId, url } of results) {
          nextMap[imageId] = url;
        }
        setParticipantProfileUrls(nextMap);
      } catch (err) {
        // console.error('PostDetail participant image batch load failed:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [participations]);

  // 추천 유저 프로필 로드
  useEffect(() => {
    let cancelled = false;

    const matchResult = post?.matchResult;

    if (!matchResult || matchResult.length === 0) {
      setRecommendedUserProfiles({});
      return;
    }
    //추천 유저 프로필 이미지 presignedurl
    (async () => {
      try {
        const entries = await Promise.all(
          matchResult.slice(0, 3).map(async (candidate) => {
            const profile = candidate.profile;

            if (!profile?.nickname) {
              return [candidate.userId, null] as const;
            }

            let imageUrl: string | null = null;
            const profileImageId =
              profile.profileImageId === null
                ? undefined
                : profile.profileImageId;

            if (profileImageId) {
              try {
                const { data } = await client.get<{ url: string }>(
                  `/binary-content/${profileImageId}/presigned-url`
                );
                imageUrl = data.url;
              } catch (err) {
                // console.error(`PostDetail recommended user image load failed for ${profileImageId}:`, err);
                imageUrl = null;
              }
            }

            return [
              candidate.userId,
              {
                nickname: profile.nickname,
                imageUrl,
              },
            ] as const;
          })
        );

        if (cancelled) return;

        const nextMap: Record<
          string,
          {
            nickname: string;
            imageUrl?: string | null;
          } | null
        > = {};

        entries.forEach(([userId, entry]) => {
          nextMap[userId] = entry;
        });

        setRecommendedUserProfiles(nextMap);
      } catch (err) {
        // console.error('PostDetail recommended user images batch load failed:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [post?.matchResult]);

  const isAuthor = user && post ? user.userId === post?.writer?.id : false;
  const isLoggedIn = !!user;

  const userParticipation = user
    ? participations.find((p) => p.requester.id === user.userId)
    : undefined;

  const handleApply = async () => {
    try {
      await client.post(`/posts/${postId}/participations`);
      await fetchPostDetail();
    } catch (err) {
      // console.error('Failed to apply for post:', err);
      toast.warning('동행 신청 중 오류가 발생했습니다.');
    }
  };

  const handleAcceptRequest = async (participationId: string) => {
    try {
      await client.patch(`/posts/${postId}/participations/${participationId}`, {
        status: '승인',
      });
      await fetchPostDetail();
    } catch (err) {
      // console.error('Failed to accept request:', err);
      toast.warning('요청 수락 중 오류가 발생했습니다.');
    }
  };

  const handleRejectRequest = async (participationId: string) => {
    try {
      await client.patch(`/posts/${postId}/participations/${participationId}`, {
        status: '거절',
      });
      await fetchPostDetail();
    } catch (err) {
      // console.error('Failed to reject request:', err);
      toast.warning('요청 거절 중 오류가 발생했습니다.');
    }
  };

  const handleCancelApplication = async () => {
    if (!userParticipation) return;
    try {
      await client.delete(
        `/posts/${postId}/participations/${userParticipation.id}`
      );
      await fetchPostDetail();
    } catch (err) {
      // console.error('Failed to cancel application:', err);
      toast.warning('신청 취소 중 오류가 발생했습니다.');
    } finally {
      setCancelModalOpen(false);
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    try {
      await client.delete(`/posts/${post.id}`);
      setDeleteModalOpen(false);
      setShowDeleteSuccessAlert(true); // 삭제 성공 알림 표시
    } catch (err) {
      // console.error('Failed to delete post:', err);
      toast.warning('게시글 삭제 중 오류가 발생했습니다.');
      setDeleteModalOpen(false);
    }
  };

  const handleCloseSuccessAlert = () => {
    setShowDeleteSuccessAlert(false);
    onOpenChange(false); // PostDetail 모달 닫기
    onDeleteSuccess(); // 부모 컴포넌트에 알림
  };

  if (isLoading) {
    return <PostDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-500">
        오류가 발생했습니다: {error.message}
      </div>
    );
  }

  if (!post) {
    return <div className="text-center py-16">게시글을 찾을 수 없습니다.</div>;
  }

  const isFull = approvedParticipants.length + 1 >= post.maxParticipants;

  let buttonConfig: {
    text: string;
    disabled: boolean;
    className: string;
    icon: React.ReactNode | null;
  } = {
    text: '로그인 후 신청 가능',
    disabled: true,
    className:
      'w-full rounded-full border border-gray-300 bg-gray-100 text-gray-400 px-6 py-6 text-lg',
    icon: null,
  };

  if (isLoggedIn) {
    if (isAuthor) {
      buttonConfig = {
        text: '여행 일정 만들기',
        disabled: false,
        className:
          'w-full rounded-full border border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground px-6 py-6 text-lg',
        icon: <DoorOpen className="w-5 h-5 mr-2" />, // 아이콘 추가
      };
    } else if (userParticipation) {
      switch (userParticipation.status) {
        case '승인':
          buttonConfig = {
            text: '여행 일정 만들기',
            disabled: false,
            className:
              'w-full rounded-full border border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground px-6 py-6 text-lg',
            icon: <DoorOpen className="w-5 h-5 mr-2" />, // 아이콘 추가
          };
          break;
        case '대기중':
          buttonConfig = {
            text: '이미 신청한 동행입니다',
            disabled: true,
            className:
              'w-full rounded-full border border-gray-300 bg-gray-100 text-gray-400 px-6 py-6 text-lg',
            icon: null,
          };
          break;
        case '거절':
          buttonConfig = {
            text: '거절된 동행입니다',
            disabled: true,
            className:
              'w-full rounded-full border border-gray-300 bg-gray-100 text-gray-400 px-6 py-6 text-lg',
            icon: null,
          };
          break;
      }
    } else if (isFull) {
      buttonConfig = {
        text: '모집이 마감되었습니다',
        disabled: true,
        className:
          'w-full rounded-full border border-gray-300 bg-gray-100 text-gray-400 px-6 py-6 text-lg',
        icon: null,
      };
    } else {
      buttonConfig = {
        text: '동행 신청하기',
        disabled: false,
        className:
          'w-full rounded-full border border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground px-6 py-6 text-lg',
        icon: null,
      };
    }
  }

  const handleButtonClick = () => {
    if (!isLoggedIn || buttonConfig.disabled) {
      return;
    }

    if ((isAuthor || userParticipation?.status === '승인') && post) {
      onJoinWorkspace(post.id, post.title);
    } else if (!userParticipation && !isFull) {
      handleApply();
    }
  };

  return (
    <div className="flex flex-col overflow-hidden h-full">
      {/* 헤더 영역 */}
      <div className="relative flex-shrink-0">
        <ImageWithFallback
          src={remoteCoverImageUrl || 'https://via.placeholder.com/800x280'}
          alt={post.title}
          className="w-full h-[280px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* 상단 컨트롤 버튼 */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 pb-12 text-white">
          {/* 상단 컨트롤 버튼 */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
            <button
              onClick={() => onOpenChange(false)}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-sm"
              aria-label="뒤로 가기"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
            <div className="flex flex-col items-end gap-2">
              <Badge className="bg-white/90 text-black flex-shrink-0 backdrop-blur-sm text-base">
                {post.status}
              </Badge>
              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-12 w-12 flex-shrink-0 text-white hover:bg-white/20 hover:text-white"
                    >
                      <MoreVertical className="w-7 h-7" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 z-50 bg-white"
                  >
                    <DropdownMenuItem
                      className="cursor-pointer focus:bg-primary focus:text-primary-foreground"
                      onClick={() => onEditPost(post)}
                    >
                      <Pencil className="w-5 h-5 mr-2" />
                      수정하기
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer text-red-600 focus:bg-primary focus:text-primary-foreground"
                      onClick={() => setDeleteModalOpen(true)}
                    >
                      <Trash2 className="w-5 h-5 mr-2" />
                      삭제하기
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer focus:bg-primary focus:text-primary-foreground">
                      <Megaphone className="w-5 h-5 mr-2" />
                      모집 마감하기
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* 중앙 제목 및 하단 정보 그룹 */}
          <div className="flex flex-col items-center gap-6">
            {/* 중앙 제목 */}
            <div className="flex items-center justify-center">
              <h2 className="text-4xl font-bold text-center break-words line-clamp-2">
                {post.title}
              </h2>
            </div>

            {/* 하단 여행 정보 */}
            <div className="flex flex-col items-center gap-3 pb-2">
              <div className="flex justify-center items-center gap-8 text-base">
                <div className="flex items-center gap-2">
                  <MapPin className="w-6 h-6" />
                  <span>{post.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-6 h-6" />
                  <span>
                    {post.startDate} ~ {post.endDate}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  <span>
                    {approvedParticipants.length + 1} / {post.maxParticipants}명
                  </span>
                </div>
              </div>
              {post.keywords && post.keywords.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-1">
                  {post.keywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="rounded-full px-3 py-1 text-white border-white/50 bg-white/10 backdrop-blur-sm text-sm"
                    >
                      {translateKeyword(keyword)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 본문 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <div className="p-8">
          <div className="mb-6">
            <div className="grid grid-cols-1 gap-4 ">
              <div className="p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-start gap-4">
                  <ImageWithFallback
                    src={
                      writerProfileImageUrl ??
                      `https://ui-avatars.com/api/?name=${post.writer?.profile?.nickname}&background=random`
                    }
                    alt={post.writer?.profile?.nickname}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-gray-900 font-semibold">
                        {post.writer?.profile?.nickname}
                      </p>
                      <Button
                        size="sm"
                        className="flex-shrink-0 rounded-full text-xs h-8"
                        onClick={() => {
                          if (post.writer?.id) {
                            onViewProfile(post.writer.id);
                          } else {
                            // console.warn('⚠️ Writer ID is missing!');
                          }
                        }}
                      >
                        프로필 보기
                      </Button>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Thermometer className="w-5 h-5 text-primary" />{' '}
                      {/* 크기 조정 */}
                      <span className="text-primary">
                        {formatMannerTemperature(post.writer?.profile)}
                      </span>
                    </div>
                    {/* 여행 성향 다시 추가 */}
                    <div className="flex flex-wrap gap-2">
                      {post.writer?.profile?.travelStyles?.map((style) => (
                        <Badge
                          key={style}
                          variant="secondary"
                          className="rounded-full px-3 py-1 text-black bg-gray-100" // 색상 변경 및 스타일 통일
                        >
                          {translateKeyword(style)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full mt-4">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('intro')}
                  className={`whitespace-nowrap border-b-2 py-2 px-1 text-base font-medium ${
                    activeTab === 'intro'
                      ? 'border-primary text-primary font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  여행 소개
                </button>
                <button
                  onClick={() => setActiveTab('participants')}
                  className={`whitespace-nowrap border-b-2 py-2 px-1 text-base font-medium ${
                    activeTab === 'participants'
                      ? 'border-primary text-primary font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  동행 목록
                </button>
                {isAuthor && (
                  <button
                    onClick={() => setActiveTab('recommendations')}
                    className={`whitespace-nowrap border-b-2 py-2 px-1 text-base font-medium ${
                      activeTab === 'recommendations'
                        ? 'border-primary text-primary font-bold'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    AI 추천 동행
                  </button>
                )}
              </nav>
            </div>

            <div className="mt-6">
              {activeTab === 'intro' && (
                <div className="rounded-xl border border-gray-200 p-6">
                  <h3 className="flex items-center text-gray-900 text-lg font-bold mb-4">
                    <FileText className="w-6 h-6 mr-2" />
                    여행 소개
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {post.content ||
                      '함께 즐거운 여행을 만들어갈 동행을 찾고 있습니다. 여행을 사랑하시는 분들의 많은 관심 부탁드립니다!'}
                  </p>
                </div>
              )}

              {activeTab === 'participants' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="flex items-center text-gray-900 text-lg font-bold mb-4">
                      <UserCheck className="w-6 h-6 mr-2" />
                      확정된 동행 ({approvedParticipants.length}명)
                    </h3>
                    <div className="space-y-3">
                      {approvedParticipants.length > 0 ? (
                        approvedParticipants.map((p) => {
                          const matchInfo = post.matchResult?.find(
                            (m) => m.userId === p.requester.id
                          );
                          return (
                            <div
                              key={p.id}
                              className="rounded-xl border border-gray-200"
                            >
                              <div className="flex items-start gap-3 p-3">
                                <ImageWithFallback
                                  src={
                                    (p.requester.profile.profileImageId
                                      ? (participantProfileUrls[
                                          p.requester.profile.profileImageId
                                        ] ?? null)
                                      : null) ??
                                    `https://ui-avatars.com/api/?name=${p.requester.profile.nickname}&background=random`
                                  }
                                  alt={p.requester.profile.nickname}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <span className="text-gray-900 font-semibold">
                                      {p.requester.profile.nickname}
                                    </span>
                                    {isAuthor && matchInfo && (
                                      <p className="text-sm text-gray-600">
                                        매칭률:{' '}
                                        {Math.round(matchInfo.score * 100)}%
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center text-sm text-gray-600 mt-1">
                                    <Thermometer className="w-5 h-5 text-primary" />
                                    <span className="text-primary">
                                      {formatMannerTemperature(
                                        p.requester.profile
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-end mt-1">
                                    <div className="flex flex-wrap gap-1">
                                      {p.requester.profile.travelStyles
                                        ?.slice(0, 3)
                                        .map((style) => (
                                          <Badge
                                            key={style}
                                            variant="secondary"
                                            className="rounded-full px-2 py-0.5 text-xs bg-gray-100"
                                          >
                                            {translateKeyword(style)}
                                          </Badge>
                                        ))}
                                    </div>
                                    <Button
                                      size="sm"
                                      className="text-xs h-8 rounded-full"
                                      onClick={() => {
                                        if (p.requester.id) {
                                          onViewProfile(p.requester.id);
                                        } else {
                                          // console.warn('⚠️ Requester ID is missing!');
                                        }
                                      }}
                                    >
                                      프로필 보기
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              {isAuthor && matchInfo && (
                                <div className="p-3 pt-2">
                                  <div className="flex flex-wrap gap-1">
                                    {[
                                      ...(matchInfo.overlappingTravelStyles ||
                                        []),
                                      ...(matchInfo.overlappingTendencies ||
                                        []),
                                    ].map((keyword) => (
                                      <Badge
                                        key={keyword}
                                        variant="secondary"
                                        className="rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-800 border border-gray-200"
                                      >
                                        {translateKeyword(keyword)}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-500 text-sm p-4 rounded-xl border border-gray-200 text-center">
                          아직 확정된 동행이 없습니다.
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="flex items-center text-gray-900 text-lg font-bold mb-4">
                      <UserPlus className="w-6 h-6 mr-2" />
                      대기중인 동행 ({pendingRequests.length}명)
                    </h3>
                    <div className="space-y-3">
                      {pendingRequests.length > 0 ? (
                        pendingRequests.map((request) => {
                          const matchInfo = post.matchResult?.find(
                            (m) => m.userId === request.requester.id
                          );
                          return (
                            <div
                              key={request.id}
                              className="rounded-xl border border-gray-200"
                            >
                              <div className="flex items-start gap-3 p-3">
                                <ImageWithFallback
                                  src={
                                    (request.requester.profile.profileImageId
                                      ? (participantProfileUrls[
                                          request.requester.profile
                                            .profileImageId
                                        ] ?? null)
                                      : null) ??
                                    `https://ui-avatars.com/api/?name=${request.requester.profile.nickname}&background=random`
                                  }
                                  alt={request.requester.profile.nickname}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <span className="text-gray-900 font-semibold">
                                      {request.requester.profile.nickname}
                                    </span>
                                    {isAuthor && matchInfo && (
                                      <p className="text-sm text-gray-600">
                                        매칭률:{' '}
                                        {Math.round(matchInfo.score * 100)}%
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center text-sm text-gray-600 mt-1">
                                    <Thermometer className="w-5 h-5 text-primary" />
                                    <span className="text-primary">
                                      {formatMannerTemperature(
                                        request.requester.profile
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-end mt-1">
                                    <div className="flex flex-wrap gap-1">
                                      {request.requester.profile.travelStyles
                                        ?.slice(0, 3)
                                        .map((style) => (
                                          <Badge
                                            key={style}
                                            variant="secondary"
                                            className="rounded-full px-2 py-0.5 text-xs bg-gray-100"
                                          >
                                            {translateKeyword(style)}
                                          </Badge>
                                        ))}
                                    </div>
                                    <Button
                                      size="sm"
                                      className="text-xs h-8 rounded-full"
                                      onClick={() => {
                                        if (request.requester.id) {
                                          onViewProfile(request.requester.id);
                                        } else {
                                          // console.warn('⚠️ Requester ID is missing!');
                                        }
                                      }}
                                    >
                                      프로필 보기
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              {isAuthor && matchInfo && (
                                <div className="p-3 pt-0">
                                  <div className="flex flex-wrap gap-1">
                                    {[
                                      ...(matchInfo.overlappingTravelStyles ||
                                        []),
                                      ...(matchInfo.overlappingTendencies ||
                                        []),
                                    ].map((keyword) => (
                                      <Badge
                                        key={keyword}
                                        variant="secondary"
                                        className="rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-800 border border-gray-200"
                                      >
                                        {translateKeyword(keyword)}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="p-3 pt-0">
                                {isAuthor && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleAcceptRequest(request.id)
                                      }
                                      className="flex-1 gap-1 bg-black text-white hover:bg-gray-800 rounded-full"
                                    >
                                      <Check className="w-5 h-5" />
                                      승인
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleRejectRequest(request.id)
                                      }
                                      className="flex-1 gap-1 rounded-full"
                                    >
                                      <X className="w-5 h-5" />
                                      거절
                                    </Button>
                                  </div>
                                )}
                                {user?.userId === request.requester.id && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-sm text-red-600 border-red-600 bg-transparent hover:bg-red-600 hover:text-white rounded-full"
                                    onClick={() => setCancelModalOpen(true)}
                                  >
                                    <X className="w-5 h-5 mr-1" />
                                    동행 신청 취소
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-gray-500 text-sm p-4 rounded-xl border border-gray-200 text-center">
                          대기중인 동행이 없습니다.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'recommendations' &&
                (isAuthor && post.matchResult && post.matchResult.length > 0 ? (
                  <div className="rounded-xl border border-gray-200 p-6">
                    <h3 className="text-gray-900 text-lg font-bold mb-4 flex items-center gap-2">
                      <UserPlus className="w-6 h-6 mr-2" />
                      AI 추천 동행 (상위 {Math.min(post.matchResult.length, 3)}
                      명)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {post.matchResult.slice(0, 3).map((candidate) => {
                        const recommendedProfile =
                          recommendedUserProfiles[candidate.userId];
                        const fallbackAvatarName =
                          recommendedProfile?.nickname ||
                          candidate.profile?.nickname ||
                          'user';
                        const isInvited = invitedUserIds.has(candidate.userId);
                        return (
                          <div
                            key={candidate.userId}
                            className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col"
                          >
                            <div className="p-4 flex-1">
                              <div className="flex items-start gap-4">
                                <ImageWithFallback
                                  src={
                                    recommendedProfile?.imageUrl ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      fallbackAvatarName
                                    )}&background=random&rounded=true`
                                  }
                                  alt={fallbackAvatarName}
                                  className="w-12 h-12 rounded-full object-cover flex-shrink-0 bg-gray-100"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center mb-1">
                                    <p className="text-gray-900 font-semibold truncate">
                                      {recommendedProfile?.nickname ||
                                        candidate.profile?.nickname ||
                                        '사용자'}
                                    </p>
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    매칭률: {Math.round(candidate.score * 100)}%
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4">
                                <div className="flex flex-wrap gap-1 h-12 overflow-hidden">
                                  {[
                                    ...(candidate.overlappingTravelStyles ||
                                      []),
                                    ...(candidate.overlappingTendencies || []),
                                  ].map((keyword) => (
                                    <Badge
                                      key={keyword}
                                      variant="secondary"
                                      className="rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-800"
                                    >
                                      {translateKeyword(keyword)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="p-4 pt-0 space-y-2">
                              <Button
                                size="sm"
                                className="w-full rounded-full h-9"
                                onClick={() => {
                                  if (candidate.userId) {
                                    onViewProfile(candidate.userId);
                                  } else {
                                    // console.warn('⚠️ Candidate userId is missing!');
                                  }
                                }}
                              >
                                프로필 보기
                              </Button>
                              <Button
                                size="sm"
                                className={`w-full rounded-full h-9 ${
                                  isInvited
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-indigo-500 text-white hover:bg-indigo-600'
                                }`}
                                disabled={isInvited}
                                onClick={() => {
                                  toast.info(
                                    `${recommendedProfile?.nickname || '사용자'}님을 초대했습니다.`
                                  );
                                  setInvitedUserIds((prev) =>
                                    new Set(prev).add(candidate.userId)
                                  );
                                }}
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                {isInvited ? '초대 완료' : '초대하기'}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm p-4 rounded-xl border border-gray-200 text-center">
                    AI 추천 동행 정보가 없습니다.
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 고정 버튼 영역 */}
      <div className="p-6 bg-white border-t border-gray-200">
        <Button
          className={`flex items-center justify-center ${buttonConfig.className}`}
          disabled={buttonConfig.disabled}
          onClick={handleButtonClick}
        >
          {buttonConfig.icon}
          {buttonConfig.text}
        </Button>
      </div>

      {/* 각종 모달 */}
      <AlertDialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <AlertDialogContent className="w-full max-w-md bg-white rounded-2xl shadow-xl p-0 focus-visible:ring-0 focus-visible:ring-offset-0 border-0">
          <div className="p-6 pb-8">
            <AlertDialogHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-xl font-bold text-gray-900">
                동행 신청을 취소하시겠어요?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500 mt-2">
                정말로 동행 신청을 취소하시겠습니까?
                <br />이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="grid grid-cols-2 gap-0 rounded-b-2xl overflow-hidden">
            <AlertDialogCancel className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 border-r border-gray-200 h-14 focus-visible:ring-0 rounded-none">
              아니오
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={handleCancelApplication}
                className="w-full h-14 focus-visible:ring-0 rounded-none border-0"
              >
                예, 취소합니다
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent className="w-full max-w-md bg-white rounded-2xl shadow-xl p-0 focus-visible:ring-0 focus-visible:ring-offset-0 border-0">
          <div className="p-6 pb-8">
            <AlertDialogHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-xl font-bold text-gray-900">
                게시글을 삭제하시겠어요?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500 mt-2">
                정말로 이 게시글을 삭제하시겠습니까?
                <br />이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="grid grid-cols-2 gap-0 rounded-b-2xl overflow-hidden">
            <AlertDialogCancel className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 border-r border-gray-200 h-14 focus-visible:ring-0 rounded-none">
              아니오
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={handleDeletePost}
                className="w-full h-14 focus-visible:ring-0 rounded-none border-0"
              >
                예, 삭제합니다
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showDeleteSuccessAlert}
        onOpenChange={setShowDeleteSuccessAlert}
      >
        <AlertDialogContent className="border-0">
          <AlertDialogHeader>
            <AlertDialogTitle>삭제 완료</AlertDialogTitle>
            <AlertDialogDescription>
              게시글이 성공적으로 삭제되었습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCloseSuccessAlert}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
