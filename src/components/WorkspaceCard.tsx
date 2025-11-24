import { useEffect, useState, useCallback } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MapPin, Calendar, Users } from 'lucide-react';
import { Badge } from './ui/badge';
import { translateKeyword } from '../utils/keyword';
import type { Post } from '../types/post';
import client from '../api/client';
import { useAuthStore } from '../store/authStore';

interface WorkspaceCardProps {
  post: Post;
  onClick?: () => void;
  onEnterClick?: () => void;
  showEnterButton?: boolean;
  buttonText?: string;
}

export function WorkspaceCard({ post, onClick }: WorkspaceCardProps) {
  const {
    title,
    location,
    startDate,
    endDate,
    writer,
    keywords,
    maxParticipants,
    participations,
    status,
  } = post;

  // Removed titleRef and related overflow logic for simplicity and consistency with NewMainPage cards

  // 총 일수 계산
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const defaultCoverImage = 'https://via.placeholder.com/400x300';
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [profileImageUrls, setProfileImageUrls] = useState<
    Record<string, string | null>
  >({});
  const { user } = useAuthStore();

  const resolveProfileImageId = useCallback(
    (ownerId?: string, originalId?: string | null) => {
      if (ownerId && ownerId === user?.userId) {
        return user?.profile?.profileImageId ?? null;
      }
      return originalId ?? null;
    },
    [user?.profile?.profileImageId, user?.userId]
  );

  useEffect(() => {
    let cancelled = false;

    const fetchCoverImage = async () => {
      if (!post.imageId) {
        setCoverImageUrl(null);
        return;
      }

      try {
        const response = await client.get(
          `/binary-content/${post.imageId}/presigned-url`
        );
        if (!cancelled) {
          setCoverImageUrl(response.data.url);
        }
      } catch (error) {
        console.error('WorkspaceCard cover image load failed:', error);
        if (!cancelled) {
          setCoverImageUrl(null);
        }
      }
    };

    fetchCoverImage();

    return () => {
      cancelled = true;
    };
  }, [post.imageId]);

  useEffect(() => {
    let cancelled = false;

    const fetchProfileImages = async () => {
      const imageIds = [
        resolveProfileImageId(writer?.id, writer?.profile?.profileImageId),
        ...(participations || [])
          .filter((p) => p.status === '승인')
          .map((p) =>
            resolveProfileImageId(
              p.requester.id,
              p.requester.profile?.profileImageId
            )
          ),
      ].filter((id): id is string => Boolean(id));

      if (imageIds.length === 0) {
        setProfileImageUrls({});
        return;
      }

      const uniqueIds = Array.from(new Set(imageIds));

      try {
        const responses = await Promise.all(
          uniqueIds.map(async (imageId) => {
            try {
              const { data } = await client.get<{ url: string }>(
                `/binary-content/${imageId}/presigned-url`
              );
              return { imageId, url: data.url };
            } catch (error) {
              console.error('WorkspaceCard profile image load failed:', error);
              return { imageId, url: null };
            }
          })
        );

        if (cancelled) return;

        const nextMap: Record<string, string | null> = {};
        for (const { imageId, url } of responses) {
          nextMap[imageId] = url;
        }
        setProfileImageUrls(nextMap);
      } catch (err) {
        console.error('WorkspaceCard profile image batch load failed:', err);
      }
    };

    fetchProfileImages();

    return () => {
      cancelled = true;
    };
  }, [
    writer?.profile?.profileImageId,
    writer?.id,
    participations,
    resolveProfileImageId,
  ]);

  const displayParticipants = [
    {
      id: writer?.id,
      name: writer?.profile?.nickname || '알 수 없음',
      profileImageId: resolveProfileImageId(
        writer?.id,
        writer?.profile?.profileImageId ?? null
      ),
      fallback: `https://ui-avatars.com/api/?name=${writer?.profile?.nickname}&background=random`,
    },
    ...(participations || [])
      .filter((p) => p.status === '승인')
      .map((p) => ({
        id: p.requester.id,
        name: p.requester.profile?.nickname || '알 수 없음',
        profileImageId: resolveProfileImageId(
          p.requester.id,
          p.requester.profile?.profileImageId ?? null
        ),
        fallback: `https://ui-avatars.com/api/?name=${p.requester.profile?.nickname}&background=random`,
      })),
  ];

  return (
    <div
      className="group flex flex-col cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg"
      onClick={onClick}
    >
      {/* 이미지 영역 */}
      <div className="relative h-48 bg-cover bg-center overflow-hidden w-full">
        <ImageWithFallback
          src={coverImageUrl ?? defaultCoverImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* 상태 배지 */}
        {(status === '모집중' ||
          status === '모집완료' ||
          status === '완료') && (
          <Badge
            className="absolute top-4 right-4 z-10 px-3 py-1 text-sm font-semibold"
            variant={status === '모집중' ? 'default' : 'secondary'}
          >
            {status === '모집중' ? '모집중' : '모집완료'}
          </Badge>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="flex flex-col flex-1 p-4">
        {/* 제목 */}
        <h3 className="text-lg font-bold text-gray-800 leading-snug truncate mb-2">
          {title}
        </h3>

        {/* 여행 키워드 */}
        {keywords && keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {keywords.map((keyword, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs px-2 py-1 bg-gray-50 border border-gray-200 text-gray-600"
              >
                #{translateKeyword(keyword)}
              </Badge>
            ))}
          </div>
        )}

        {/* 여행지 */}
        <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
          <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400" />
          <span className="truncate">{location}</span>
        </div>

        {/* 여행 기간 */}
        <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
          <Calendar className="w-4 h-4 flex-shrink-0 text-gray-400" />
          <span>
            {startDate} ~ {endDate} ({calculateDays()}일)
          </span>
        </div>

        {/* 참여자 정보 */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          {/* 참여자 프로필 이미지 (중첩) */}
          <div className="flex -space-x-2">
            {displayParticipants.slice(0, 3).map((participant, index) => {
              if (!participant) return null;

              const resolvedUrl = participant.profileImageId
                ? profileImageUrls[participant.profileImageId]
                : undefined;

              return (
                <ImageWithFallback
                  key={participant.id}
                  src={resolvedUrl ?? participant.fallback}
                  alt={participant.name}
                  className="w-7 h-7 rounded-full object-cover border-2 border-white"
                  style={{ zIndex: displayParticipants.length - index }}
                />
              );
            })}
            {displayParticipants.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
                +{displayParticipants.length - 3}
              </div>
            )}
          </div>

          {/* 모집 인원 */}
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Users className="w-4 h-4 text-gray-400" />
            <span>
              {displayParticipants.length}/{maxParticipants || 0}명
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
