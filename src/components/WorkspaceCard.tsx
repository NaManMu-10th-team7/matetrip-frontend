import { ImageWithFallback } from './figma/ImageWithFallback';
import { MapPin, Calendar, Users } from 'lucide-react';
import { Badge } from './ui/badge';
import { translateKeyword } from '../utils/keyword';
import type { Post } from '../types/post';

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

  // API 응답에 커버 이미지가 없으므로 임시 플레이스홀더를 사용합니다.
  const coverImage = 'https://via.placeholder.com/400x300';

  // 참여자 목록을 구성합니다. writer와 participations를 사용합니다.
  const displayParticipants = [
    {
      id: writer?.id,
      name: writer?.profile?.nickname || '알 수 없음', // nullish coalescing operator 추가
      profileImage:
        writer?.profile?.profileImageId ||
        `https://ui-avatars.com/api/?name=${writer?.profile?.nickname}&background=random`,
    },
    ...(participations || [])
      .filter((p) => p.status === '승인')
      .map((p) => ({
        id: p.requester.id,
        name: p.requester.profile?.nickname || '알 수 없음', // nullish coalescing operator 추가
        profileImage:
          p.requester.profile?.profileImageId ||
          `https://ui-avatars.com/api/?name=${p.requester.profile?.nickname}&background=random`,
      })),
  ];

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
          src={coverImage}
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
                {displayParticipants
                  .slice(0, 3)
                  .map(
                    (participant, index) =>
                      participant && (
                        <ImageWithFallback
                          key={participant.id}
                          src={participant.profileImage}
                          alt={participant.name}
                          className="w-8 h-8 rounded-full object-cover border-2 border-white"
                          style={{ zIndex: displayParticipants.length - index }}
                        />
                      )
                  )}
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
