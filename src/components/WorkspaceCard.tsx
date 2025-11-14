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
      className="relative w-[270px] flex flex-col gap-[12px] cursor-pointer"
      onClick={onClick}
    >
      {/* 이미지 영역과 키워드 */}
      <div className="flex flex-col gap-3">
        {/* 커버 이미지 */}
        <div className="h-[252px] rounded-2xl overflow-hidden relative">
          <ImageWithFallback
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover"
          />
          {/* 여행 키워드 - 한 줄로 제한 */}
          {keywords && keywords.length > 0 && (
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
              {/* 오른쪽 fade 효과 */}
              {/* <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" /> */}
            </div>
          )}
          {/* 프로필 이미지 - 이미지 내부 좌측 하단
          {displayParticipants[0] && (
            <div className="absolute left-2 bottom-2 w-12 h-12 rounded-full bg-white overflow-hidden">
              <ImageWithFallback
                src={displayParticipants[0].profileImage}
                alt={displayParticipants[0].name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          )} */}
        </div>

        
      </div>

      {/* 콘텐츠 */}
      <div className="flex flex-col gap-2 px-2">
        {/* 제목 */}
        <div className="relative overflow-hidden">
          <h3 className="text-xl font-bold text-black leading-tight whitespace-nowrap">{title}</h3>
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
        {/* 참여자 프로필 이미지 (중첩) */}
        <div className="flex -space-x-8">
          {displayParticipants.slice(0, 3).map((participant, index) =>
            participant && (
              <ImageWithFallback
                key={participant.id}
                src={participant.profileImage}
                alt={participant.name}
                className="w-8 h-8 rounded-full object-cover"
                style={{ zIndex: displayParticipants.length - index }}
              />
            )
          )}
        </div>
        
        {/* 모집 인원 */}
        <div className="flex items-center gap-1">
          <Users className="w-6 h-6 text-[#4e4a65]" />
          <span className="text-xs font-medium text-[#4e4a65]">
            {displayParticipants.length}/{maxParticipants || 0}명 모집중
          </span>
        </div>
      </div>

      {/* 상태 배지 - 우측 상단 */}
      {status && (
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-lg text-xs font-medium ${
          status === '모집중' 
            ? 'bg-[#101828] text-white' 
            : 'bg-gray-100 text-[#101828]'
        }`}>
          {status}
        </div>
      )}
    </div>
  );
}
