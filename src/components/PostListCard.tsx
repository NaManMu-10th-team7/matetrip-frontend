import { ImageWithFallback } from './figma/ImageWithFallback';
import { MapPin, Calendar, Users } from 'lucide-react';
import { Badge } from './ui/badge';
import { translateKeyword } from '../utils/keyword';
import type { Post } from '../types/post';
import { API_BASE_URL } from '../api/client';

interface PostListCardProps {
  post: Post;
  onClick?: () => void;
}

export function PostListCard({ post, onClick }: PostListCardProps) {
  const {
    title,
    location,
    startDate,
    endDate,
    writerProfile,
    keywords,
    maxParticipants,
    participations,
    status,
    imageId,
  } = post;

  const currentParticipants =
    (participations?.filter((p) => p.status === '승인').length || 0) + 1;
  const imageUrl = imageId
    ? `${API_BASE_URL}/binary-content/${imageId}/presigned-url`
    : undefined;

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
  const defaultProfileImage = `https://ui-avatars.com/api/?name=${
    writerProfile?.nickname ?? '?'
  }&background=random`;

  return (
    <div
      className="relative min-w-[250px] flex flex-col gap-[12px] cursor-pointer"
      onClick={onClick}
    >
      {/* 이미지 영역과 키워드 */}
      <div className="flex flex-col gap-3">
        {/* 커버 이미지 */}
        <div className="h-[252px] rounded-2xl overflow-hidden relative">
          <ImageWithFallback
            src={imageUrl ?? defaultCoverImage}
            alt={title}
            className="w-full h-full object-cover"
          />
          {/* 여행 키워드 - 한 줄로 제한 */}
          {keywords && Array.isArray(keywords) && keywords.length > 0 && (
            <div className="absolute left-2 bottom-2 w-[250px] overflow-hidden">
              <div className="flex gap-1 overflow-x-auto no-scrollbar">
                {keywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs px-2 py-1 bg-gray-50 border border-gray-200 flex-shrink-0 whitespace-nowrap"
                  >
                    #{translateKeyword(keyword)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* 상태 배지 */}
        {(status === '모집중' || status === '완료' || status === '모집완료') && (
          <Badge
            className="absolute top-4 right-4 z-10 px-3 py-1 text-sm font-semibold"
            variant={status === '모집중' ? 'default' : 'secondary'}
          >
            {status}
          </Badge>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="flex flex-col gap-2 px-2">
        {/* 제목 */}
        <div className="relative overflow-hidden">
          <h3 className="text-lg font-bold text-black leading-tight whitespace-nowrap">
            {title}
          </h3>
          {/* 오른쪽 fade 효과 */}
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        </div>

        {/* 여행지 */}
        <div className="flex items-center gap-1">
          <MapPin className="w-5 h-5 flex-shrink-0 text-gray-600" />
          <span className="text-sm font-medium text-gray-600">{location}</span>
        </div>

        {/* 여행 기간 */}
        <div className="flex items-center gap-1 overflow-hidden">
          <Calendar className="w-5 h-5 flex-shrink-0 text-gray-600" />
          <span className="text-sm font-medium text-gray-600 leading-tight whitespace-nowrap">
            {startDate} ~ {endDate} ({calculateDays()}일)
          </span>
        </div>
      </div>

      {/* 참여자 정보 */}
      <div className="flex items-center gap-2 px-2">
        {/* 작성자 프로필 이미지 */}
        <div className="flex -space-x-2">
          <ImageWithFallback
            src={
              (writerProfile as any)?.profileImageUrl ?? defaultProfileImage
            }
            alt={writerProfile?.nickname ?? ''}
            className="w-8 h-8 rounded-full object-cover border-2 border-white"
          />
        </div>

        {/* 모집 인원 */}
        <div className="flex items-center gap-1">
          <Users className="w-6 h-6 text-[#4e4a65]" />
          <span className="text-xs font-medium text-[#4e4a65]">
            {currentParticipants}/{maxParticipants || 0}명 모집중
          </span>
        </div>
      </div>
    </div>
  );
}
