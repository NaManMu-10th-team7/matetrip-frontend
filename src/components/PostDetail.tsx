import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
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
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ImageWithFallback } from './figma/ImageWithFallback';
import client from '../api/client';
import { type Post, type Participation } from '../types/post';
import { translateKeyword } from '../utils/keyword';
import { useAuthStore } from '../store/authStore';
import { API_BASE_URL } from '../api/client';

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

  const fetchPostDetail = useCallback(async () => {
    if (!postId) return;
    setIsLoading(true);
    setError(null);
    try {
      const postResponse = await client.get<Post>(`/posts/${postId}`);
      const fetchedPost = postResponse.data;
      console.log('PostDetail fetched post', fetchedPost);
      setPost(fetchedPost);
      if (fetchedPost.imageId) {
        try {
          const payload = await client.get<{ url: string }>(
            `/binary-content/${fetchedPost.imageId}/presigned-url`
          );
          setRemoteCoverImageUrl(payload.data.url);
        } catch (imageErr) {
          console.error('Post detail cover image load failed:', imageErr);
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
      console.error('Failed to fetch post details:', err);
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
        console.error('PostDetail writer image load failed:', err);
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
              console.error('PostDetail participant image load failed:', err);
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
        console.error('PostDetail participant image batch load failed:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [participations]);

  const isAuthor = user && post ? user.userId === post?.writer?.id : false;
  const isLoggedIn = !!user;

  const userParticipation = user
    ? participations.find((p) => p.requester.id === user.userId)
    : undefined;

  const handleApply = async () => {
    try {
      await client.post(`/posts/${postId}/participations`);
      alert('동행 신청이 완료되었습니다.');
      await fetchPostDetail();
    } catch (err) {
      console.error('Failed to apply for post:', err);
      alert('동행 신청 중 오류가 발생했습니다.');
    }
  };

  const handleAcceptRequest = async (participationId: string) => {
    try {
      await client.patch(`/posts/${postId}/participations/${participationId}`, {
        status: '승인',
      });
      alert('신청을 수락했습니다.');
      await fetchPostDetail();
    } catch (err) {
      console.error('Failed to accept request:', err);
      alert('요청 수락 중 오류가 발생했습니다.');
    }
  };

  const handleRejectRequest = async (participationId: string) => {
    try {
      await client.patch(`/posts/${postId}/participations/${participationId}`, {
        status: '거절',
      });
      alert('신청을 거절했습니다.');
      await fetchPostDetail();
    } catch (err) {
      console.error('Failed to reject request:', err);
      alert('요청 거절 중 오류가 발생했습니다.');
    }
  };

  const handleViewProfile = (userId: string) => {
    onViewProfile(userId);
  };

  const handleCancelApplication = async () => {
    if (!userParticipation) return;
    try {
      await client.delete(
        `/posts/${postId}/participations/${userParticipation.id}`
      );
      alert('동행 신청이 취소되었습니다.');
      await fetchPostDetail();
    } catch (err) {
      console.error('Failed to cancel application:', err);
      alert('신청 취소 중 오류가 발생했습니다.');
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
      console.error('Failed to delete post:', err);
      alert('게시글 삭제 중 오류가 발생했습니다.');
      setDeleteModalOpen(false);
    }
  };

  const handleCloseSuccessAlert = () => {
    setShowDeleteSuccessAlert(false);
    onOpenChange(false); // PostDetail 모달 닫기
    onDeleteSuccess(); // 부모 컴포넌트에 알림
  };

  if (isLoading) {
    return <div className="text-center py-16">게시글을 불러오는 중...</div>;
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

  let buttonConfig = {
    text: '로그인 후 신청 가능',
    disabled: true,
    className: 'w-full',
  };

  if (isLoggedIn) {
    if (isAuthor) {
      buttonConfig = {
        text: '워크스페이스 입장',
        disabled: false,
        className:
          'w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
      };
    } else if (userParticipation) {
      switch (userParticipation.status) {
        case '승인':
          buttonConfig = {
            text: '워크스페이스 입장',
            disabled: false,
            className:
              'w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
          };
          break;
        case '대기중':
          buttonConfig = {
            text: '이미 신청한 동행입니다',
            disabled: true,
            className: 'w-full bg-gray-400',
          };
          break;
        case '거절':
          buttonConfig = {
            text: '거절된 동행입니다',
            disabled: true,
            className: 'w-full bg-gray-400',
          };
          break;
      }
    } else if (isFull) {
      buttonConfig = {
        text: '모집이 마감되었습니다',
        disabled: true,
        className: 'w-full bg-gray-400',
      };
    } else {
      buttonConfig = {
        text: '동행 신청하기',
        disabled: false,
        className: 'w-full bg-blue-600 hover:bg-blue-700',
      };
    }
  }

  const handleButtonClick = () => {
    if (!isLoggedIn || buttonConfig.disabled) return;

    if (isAuthor || userParticipation?.status === '승인') {
      onJoinWorkspace(post.id, post.title);
    } else if (!userParticipation && !isFull) {
      handleApply();
    }
  };

  return (
    <>
      <DialogTitle className="sr-only">{post.title}</DialogTitle>
      <DialogDescription className="sr-only">
        {post.location} 여행 상세 정보
      </DialogDescription>

      <div className="px-6 py-4 border-b bg-white flex-shrink-0 flex items-center justify-between">
        <button
          onClick={() => onOpenChange(false)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm"
          aria-label="뒤로 가기"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={() => onOpenChange(false)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm"
          aria-label="닫기"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6 pb-20">
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-gray-900 text-3xl font-bold flex-1 min-w-0 truncate">
                  {post.title}
                </h2>
                <Badge className="bg-blue-600 text-white flex-shrink-0">
                  {post.status}
                </Badge>
                {isAuthor && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-sm h-8 w-8 p-0 flex-shrink-0"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      side="right"
                      className="w-48"
                    >
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => onEditPost(post)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        수정하기
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-red-600 focus:text-red-600"
                        onClick={() => setDeleteModalOpen(true)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        삭제하기
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <Megaphone className="w-4 h-4 mr-2" />
                        모집 마감하기
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl border h-full">
                    <ImageWithFallback
                      src={
                        writerProfileImageUrl ??
                        `https://ui-avatars.com/api/?name=${post.writer?.profile?.nickname}&background=random`
                      }
                      alt={post.writer?.profile?.nickname}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 mb-2">
                        {post.writer?.profile?.nickname}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <Thermometer className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-600">
                          {formatMannerTemperature(post.writer?.profile)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {post.writer?.profile?.travelStyles?.map((style) => (
                          <Badge
                            key={style}
                            variant="secondary"
                            className="text-xs"
                          >
                            {translateKeyword(style)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0 self-start whitespace-nowrap"
                      onClick={() =>
                        post.writer?.id && handleViewProfile(post.writer.id)
                      }
                    >
                      프로필 보기
                    </Button>
                  </div>
                </div>

                <div className="flex-1 flex justify-center">
                  <div className="relative w-full max-w-[450px] min-h-[200px] max-h-[400px] rounded-xl overflow-hidden bg-gray-100">
                    <ImageWithFallback
                      src={
                        remoteCoverImageUrl ||
                        'https://via.placeholder.com/400x300'
                        //'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 bg-white rounded-xl border p-6">
              <h3 className="text-gray-900 mb-4">여행 소개</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.content ||
                  '함께 즐거운 여행을 만들어갈 동행을 찾고 있습니다. 여행을 사랑하시는 분들의 많은 관심 부탁드립니다!'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-gray-900 mb-4">
                  확정된 동행 ({approvedParticipants.length}명)
                </h3>
                <div className="space-y-3">
                  {approvedParticipants.length > 0 ? (
                    approvedParticipants.map((p) => (
                      <div
                        key={p.id}
                        className="flex flex-col gap-2 p-4 bg-white rounded-xl border"
                      >
                        <div className="flex items-start gap-3">
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
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-gray-900">
                                {p.requester.profile.nickname}
                              </span>
                              <div className="flex items-center gap-1 text-sm text-blue-600">
                                <Thermometer className="w-4 h-4" />
                                <span>
                                  {formatMannerTemperature(p.requester.profile)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {/* 😨동행자 키워드  주석 처리  */}
                              {/* {p.requester.profile.travelStyles?.map(
                                (style, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs text-gray-600"
                                  >
                                    #{translateKeyword(style)}
                                  </span>
                                )
                              )} */}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 self-start flex-shrink-0"
                            onClick={() => handleViewProfile(p.requester.id)}
                          >
                            프로필 보기
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm p-4 bg-white rounded-xl border">
                      아직 확정된 동행이 없습니다.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-gray-900 mb-4">
                  대기중인 동행 ({pendingRequests.length}명)
                </h3>
                <div className="space-y-3">
                  {pendingRequests.length > 0 ? (
                    pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex flex-col gap-2 p-4 bg-white rounded-xl border"
                      >
                        <div className="flex items-start gap-3">
                          <ImageWithFallback
                            src={
                              (request.requester.profile.profileImageId
                                ? (participantProfileUrls[
                                    request.requester.profile.profileImageId
                                  ] ?? null)
                                : null) ??
                              `https://ui-avatars.com/api/?name=${request.requester.profile.nickname}&background=random`
                            }
                            alt={request.requester.profile.nickname}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-gray-900">
                                {request.requester.profile.nickname}
                              </span>
                              <div className="flex items-center gap-1 text-sm text-blue-600">
                                <Thermometer className="w-4 h-4" />
                                <span>
                                  {formatMannerTemperature(
                                    request.requester.profile
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {/* 😨동행 신청자 키워드  주석 처리  */}
                              {/* {request.requester.profile.travelStyles?.map(
                                (style, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs text-gray-600"
                                  >
                                    #{translateKeyword(style)}
                                  </span>
                                )
                              )} */}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 self-start flex-shrink-0"
                            onClick={() =>
                              handleViewProfile(request.requester.id)
                            }
                          >
                            프로필 보기
                          </Button>
                        </div>
                        {isAuthor && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptRequest(request.id)}
                              className="flex-1 gap-1 bg-blue-600 hover:bg-blue-700"
                            >
                              <Check className="w-4 h-4" />
                              승인
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectRequest(request.id)}
                              className="flex-1 gap-1"
                            >
                              <X className="w-4 h-4" />
                              거절
                            </Button>
                          </div>
                        )}
                        {user?.userId === request.requester.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setCancelModalOpen(true)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            동행 신청 취소
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm p-4 bg-white rounded-xl border">
                      대기중인 동행이 없습니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-96 border-l bg-white p-8 overflow-y-auto flex-shrink-0">
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-gray-900 pb-2 border-b font-bold">
                여행 정보
              </h3>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>여행 일정</span>
                  </div>
                  <p className="text-gray-900 ml-6">
                    {post.startDate} ~ {post.endDate}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>여행지</span>
                  </div>
                  <p className="text-gray-900 ml-6">{post.location}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Users className="w-4 h-4" />
                    <span>모집 인원</span>
                  </div>
                  <p className="text-gray-900 ml-6">
                    {approvedParticipants.length + 1} / {post.maxParticipants}명
                  </p>
                </div>
              </div>
            </div>

            {post.keywords && post.keywords.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-gray-900 pb-2 border-b font-bold">
                  여행 키워드
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {translateKeyword(keyword)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button
              className={buttonConfig.className}
              disabled={buttonConfig.disabled}
              onClick={handleButtonClick}
            >
              {buttonConfig.text}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-gray-900">동행 신청 취소</DialogTitle>
          <DialogDescription>
            정말로 동행 신청을 취소하시겠습니까?
            <br />이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCancelModalOpen(false)}
            >
              아니오
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={handleCancelApplication}
            >
              예, 취소합니다
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-gray-900">게시글 삭제</DialogTitle>
          <DialogDescription>
            정말로 이 게시글을 삭제하시겠습니까?
            <br />이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteModalOpen(false)}
            >
              아니오
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={handleDeletePost}
            >
              예, 삭제합니다
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showDeleteSuccessAlert}
        onOpenChange={setShowDeleteSuccessAlert}
      >
        <AlertDialogContent>
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
    </>
  );
}
