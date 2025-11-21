import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Thermometer, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import client from '../api/client';
import { type Post } from '../types/post';
import { translateKeyword } from '../utils/keyword';
import { useAuthStore } from '../store/authStore';

interface PostPreviewProps {
  postId: string;
  onJoinWorkspace: (postId: string, workspaceName: string) => void;
  onViewFullDetail: () => void;
  onClose: () => void;
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

export function PostPreview({
  postId,
  onJoinWorkspace,
  onViewFullDetail,
  onClose,
}: PostPreviewProps) {
  const { user } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [writerProfileImageUrl, setWriterProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const response = await client.get<Post>(`/posts/${postId}`);
        setPost(response.data);

        // 커버 이미지 가져오기
        if (response.data.imageId) {
          try {
            const imageResponse = await client.get<{ url: string }>(
              `/binary-content/${response.data.imageId}/presigned-url`
            );
            setCoverImageUrl(imageResponse.data.url);
          } catch (error) {
            console.error('Failed to fetch cover image:', error);
          }
        }

        // 작성자 프로필 이미지 가져오기
        const profileImageId = response.data.writer?.profile?.profileImageId;
        if (profileImageId) {
          try {
            const profileImageResponse = await client.get<{ url: string }>(
              `/binary-content/${profileImageId}/presigned-url`
            );
            setWriterProfileImageUrl(profileImageResponse.data.url);
          } catch (error) {
            console.error('Failed to fetch writer profile image:', error);
          }
        }
      } catch (error) {
        console.error('Failed to fetch post:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">게시글을 찾을 수 없습니다.</p>
          <Button onClick={onClose} className="mt-4">
            닫기
          </Button>
        </div>
      </div>
    );
  }

  const isAuthor = user && user.userId === post.writer?.id;
  const userParticipation = post.participations?.find(
    (p) => p.requester.id === user?.userId
  );
  const approvedCount = post.participations?.filter((p) => p.status === '승인').length || 0;
  const isFull = approvedCount + 1 >= post.maxParticipants;

  let buttonConfig = {
    text: '동행 신청하기',
    disabled: false,
    onClick: () => {
      // 신청 로직은 전체 상세보기에서 처리
      onViewFullDetail();
    },
  };

  if (isAuthor) {
    buttonConfig = {
      text: '워크스페이스 입장',
      disabled: false,
      onClick: () => onJoinWorkspace(post.id, post.title),
    };
  } else if (userParticipation) {
    if (userParticipation.status === '승인') {
      buttonConfig = {
        text: '워크스페이스 입장',
        disabled: false,
        onClick: () => onJoinWorkspace(post.id, post.title),
      };
    } else if (userParticipation.status === '대기중') {
      buttonConfig = {
        text: '신청 대기 중',
        disabled: true,
        onClick: () => {},
      };
    } else {
      buttonConfig = {
        text: '거절됨',
        disabled: true,
        onClick: () => {},
      };
    }
  } else if (isFull) {
    buttonConfig = {
      text: '모집 마감',
      disabled: true,
      onClick: () => {},
    };
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">여행 상세</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Cover Image */}
        {coverImageUrl && (
          <div className="w-full h-78 bg-gray-200">
            <ImageWithFallback
              src={coverImageUrl}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Title & Status */}
          <div>
            <div className="flex items-start gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 flex-1">
                {post.title}
              </h1>
              <Badge className="bg-blue-600 text-white flex-shrink-0">
                {post.status}
              </Badge>
            </div>
          </div>

          {/* Writer Info */}
          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
            <ImageWithFallback
              src={
                writerProfileImageUrl ||
                `https://ui-avatars.com/api/?name=${post.writer?.profile?.nickname}&background=random`
              }
              alt={post.writer?.profile?.nickname}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {post.writer?.profile?.nickname}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Thermometer className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-600">
                  {formatMannerTemperature(post.writer?.profile)}
                </span>
              </div>
            </div>
          </div>

          {/* Travel Info */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">여행 정보</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {post.startDate} ~ {post.endDate}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{post.location}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {approvedCount + 1} / {post.maxParticipants}명
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {post.content && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">여행 소개</h3>
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                {post.content}
              </p>
            </div>
          )}

          {/* Keywords */}
          {post.keywords && post.keywords.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">여행 키워드</h3>
              <div className="flex flex-wrap gap-2">
                {post.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {translateKeyword(keyword)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="p-6 border-t space-y-2 flex-shrink-0">
        <Button
          onClick={buttonConfig.onClick}
          disabled={buttonConfig.disabled}
          className="w-full bg-[#101828] text-white"
        >
          {buttonConfig.text}
        </Button>
        <Button
          onClick={onViewFullDetail}
          variant="outline"
          className="w-full"
        >
          전체 상세보기
        </Button>
      </div>
    </div>
  );
}

