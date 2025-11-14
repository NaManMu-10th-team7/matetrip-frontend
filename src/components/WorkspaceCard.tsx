import { useEffect, useState, useCallback } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MapPin, Calendar, Users } from 'lucide-react';
import { Badge } from './ui/badge';
import { translateKeyword } from '../utils/keyword';
import type { Post } from '../types/post';
import { API_BASE_URL } from '../api/client';
import client from '../api/client';
import { useAuthStore } from '../store/authStore';

interface WorkspaceCardProps {
  post: Post;
  onClick?: () => void;
  onEnterClick?: () => void;
  showEnterButton?: boolean;
  buttonText?: string;
}

export function WorkspaceCard({
  post,
  onClick,
  // onEnterClick,
  // showEnterButton,
  // buttonText,
}: WorkspaceCardProps) {
  const {
    title,
    location,
    startDate,
    endDate,
    writer, // 변경: writerProfile 대신 writer 사용
    keywords,
    maxParticipants,
    participations, // 변경: participations 추가
    status, // 게시글 상태 추가
  } = post;

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
        const response = await fetch(
          `${API_BASE_URL}/binary-content/${post.imageId}/presigned-url`,
          {
            credentials: 'include',
            //cache: 'no-store',
          }
        );

        if (!response.ok) {
          throw new Error('게시글 이미지를 불러오지 못했습니다.');
        }

        const payload = await response.json();
        //console.log('WorkspaceCard presigned payload', post.imageId, payload);
        const { url } = payload;
        if (!cancelled) {
          setCoverImageUrl(url);
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
      // console.log('WorkspaceCard profile image IDs', uniqueIds);

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

  // 참여자 목록을 구성합니다. writer와 participations를 사용합니다.
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

  // useEffect(() => {
  //   console.log('WorkspaceCard writer profile', writer?.profile);
  //   console.log(
  //     'WorkspaceCard participant profiles',
  //     (participations || []).map((p) => p.requester.profile)
  //   );
  // }, [writer?.profile, participations]);

  return (
    <div
      className="bg-white rounded-2xl shadow-lg overflow-hidden mx-4 hover:shadow-xl transition-shadow cursor-pointer relative h-full flex flex-col"
      onClick={onClick}
    >
      {/* 상태 배지 */}
      {(status === '모집중' || status === '완료') && (
        <Badge
          className="absolute top-4 right-4 z-10 px-3 py-1 text-sm font-semibold"
          variant={status === '모집중' ? 'default' : 'secondary'}
        >
          {status === '모집중' ? '모집중' : '모집완료'}
        </Badge>
      )}

      {/* 커버 이미지 */}
      <div className="h-48 overflow-hidden flex-shrink-0">
        <ImageWithFallback
          src={coverImageUrl ?? defaultCoverImage}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 콘텐츠 */}
      <div className="p-6 space-y-1.5 flex flex-col flex-grow">
        {/* 제목 */}
        <h3 className="text-gray-900 text-xl font-bold truncate">{title}</h3>

        {/* 여행지 */}
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>

        {/* 여행 기간 */}
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            {startDate} ~ {endDate} ({calculateDays()}일)
          </span>
        </div>

        {/* 여행 키워드 */}
        {keywords && keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {keywords.map((keyword, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                #{translateKeyword(keyword)}
              </Badge>
            ))}
          </div>
        )}

        {/* 참여자 목록 */}
        <div className="pt-4 border-t mt-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex -space-x-2 flex-shrink-0">
                {displayParticipants.slice(0, 3).map((participant, index) => {
                  if (!participant) return null;

                  const resolvedUrl = participant.profileImageId
                    ? profileImageUrls[participant.profileImageId]
                    : undefined;

                  // if (participant.profileImageId) {
                  //   console.log(
                  //     'WorkspaceCard profile image URL',
                  //     participant.profileImageId,
                  //     resolvedUrl
                  //   );
                  // }

                  return (
                    <ImageWithFallback
                      key={participant.id}
                      src={resolvedUrl ?? participant.fallback}
                      alt={participant.name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-white"
                      style={{ zIndex: displayParticipants.length - index }}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-1 text-gray-500 text-sm">
                <Users className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">
                  {displayParticipants.length}/{maxParticipants || 0}명 모집중
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
