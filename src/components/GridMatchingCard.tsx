import { useEffect, useState, useMemo } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import {
  MapPin,
  Calendar,
  User,
  Sparkles,
  Tag,
  UserCheck,
  Users,
} from 'lucide-react';
import { Badge } from './ui/badge';
import type { MatchingInfo } from '../types/matching';
import { API_BASE_URL } from '../api/client';
import type { MatchRecruitingPostDto } from '../types/matchSearch';
import type { Post } from '../types/post';

// ExtendedMatchingInfo 인터페이스를 제거합니다.
// interface ExtendedMatchingInfo extends Omit<MatchingInfo, 'tendency' | 'style'> {
//   tendency?: string[];
//   style?: string[];
// }

interface GridMatchingCardProps {
  /** 추천 카드에 표시할 모집글 정보 (Post 또는 MatchRecruitingPostDto) */
  post: Post | MatchRecruitingPostDto;
  /** 이 카드에만 필요한 매칭 정보 */
  matchingInfo: MatchingInfo; // ExtendedMatchingInfo 대신 MatchingInfo 사용
  /** 카드 클릭 이벤트 핸들러 */
  onClick?: () => void;
  /** 추천 순위 (1부터 시작) */
  rank?: number;
  /** 작성자 프로필 이미지 URL */
  writerProfileImageUrl?: string | null;
  /** 작성자 닉네임 (검색 결과 등에서 전달) */
  writerNickname?: string | null;
}

const defaultCoverImage = 'https://via.placeholder.com/400x300';

/**
 * 그리드용 평면 매칭 카드 컴포넌트 (Figma 디자인 기반)
 * - 3D 구조 없음
 * - 이미지, 제목, 장소, 기간, 매칭률 표시
 */
export function GridMatchingCard({
  post,
  matchingInfo,
  onClick,
  rank,
  writerProfileImageUrl,
  writerNickname,
}: GridMatchingCardProps) {
  const {
    title,
    location,
    startDate,
    endDate,
    writer,
    participations,
    maxParticipants,
  } = post;
  // tendency와 style은 이제 string 타입으로 받습니다.
  const { score, tendency, style, vectorScore } = matchingInfo;

  const safeScore =
    typeof score === 'number' && !Number.isNaN(score)
      ? Math.min(100, Math.max(0, score))
      : 0;
  const safeVectorScore =
    typeof vectorScore === 'number' && !Number.isNaN(vectorScore)
      ? Math.min(100, Math.max(0, vectorScore))
      : null;

  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false); // Hover 상태 추가

  const currentParticipants =
    1 + (participations?.filter((p) => p.status === '승인').length ?? 0);

  const renderDateText = () => {
    if (!startDate || !endDate) {
      return '일정 미정';
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    // 종료일이 시작일보다 빠르면 유효하지 않은 기간으로 간주
    if (start > end) return `${startDate} ~ ${endDate}`;

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${startDate} ~ ${endDate} (${diffDays}일)`;
  };

  // 게시글 이미지 로드
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
          }
        );

        if (!response.ok) {
          throw new Error('게시글 이미지를 불러오지 못했습니다.');
        }

        const payload = await response.json();
        const { url } = payload;
        if (!cancelled) {
          setCoverImageUrl(url);
        }
      } catch (error) {
        console.error('GridMatchingCard cover image load failed:', error);
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

  // 매칭 키워드 존재 여부
  const hasMatchingKeywords = useMemo(() => {
    // tendency와 style이 string이므로, 존재 여부와 길이가 0보다 큰지 확인
    return (tendency && tendency.length > 0) || (style && style.length > 0) || (safeVectorScore !== null && safeVectorScore > 0);
  }, [tendency, style, safeVectorScore]);

  return (
    <div
      className="flex flex-col gap-3 w-full cursor-pointer hover:opacity-90 transition-opacity"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)} // Hover 시작 시 상태 변경
      onMouseLeave={() => setIsHovered(false)} // Hover 종료 시 상태 변경
    >
      {/* 이미지 영역 */}
      <div className="relative h-[290px] bg-gray-300 rounded-[16px] overflow-hidden w-full">
        <ImageWithFallback
          src={coverImageUrl ?? defaultCoverImage}
          alt={title}
          className="w-full h-full object-cover"
        />

        {/* Best 배지 (rank === 1일 때만) */}
        {rank === 1 && (
          <div className="absolute top-2 right-2 bg-[#101828] px-3 py-1 rounded-[8px]">
            <p className="text-white text-[16px] font-medium">Best</p>
          </div>
        )}

        {/* 2nd, 3rd, 4th... 배지 */}
        {rank && rank > 1 && rank <= 9 && (
          <div className="absolute top-2 right-2 bg-[#101828] px-3 py-1 rounded-[8px]">
            <p className="text-white text-[16px] font-medium">
              {rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`}
            </p>
          </div>
        )}

        {/* 하단 오버레이: 프로필 아이콘 + 매칭률 */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3 bg-gradient-to-t from-black/70 to-transparent pt-8">
          {/* 프로필 (사진 + 닉네임) */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-gray-700/50">
              {writerProfileImageUrl ? (
                <ImageWithFallback
                  src={writerProfileImageUrl}
                  alt="작성자 프로필"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <p className="w-24 text-base font-semibold text-white leading-tight text-center truncate">
              {writerNickname ?? writer?.profile?.nickname ?? '작성자'}
            </p>
          </div>

          {/* 매칭 정보 (매칭률) */}
          <div className="flex flex-col items-end gap-2 pb-1 min-w-0">
            <div className="flex items-baseline gap-1 flex-shrink-0">
              <p className="text-base font-medium text-white leading-tight mr-1">
                매칭률
              </p>
              <p className="text-3xl font-bold text-white leading-none">
                {safeScore}
              </p>
              <p className="text-sm font-medium text-white leading-tight">%</p>
            </div>
          </div>
        </div>

        {/* 일치하는 성향/스타일/프로필 유사도 (hover 시 이미지 중앙에 오버레이) */}
        {hasMatchingKeywords && (
          <div
            className={`absolute inset-0 flex flex-col items-start justify-center bg-black/50 transition-opacity duration-300 ${ // items-start로 변경
              isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <p className="text-white text-lg font-bold mb-4 w-full text-center"> {/* w-full text-center 추가 */}
              우리, 이렇게 잘 맞아요!
            </p>
            <div className="flex flex-col gap-3 w-full px-4"> {/* max-w-xs mx-auto 제거, w-full 유지 */}
              {/* style이 string이므로 split하여 배열로 만든 후 map 사용 */}
              {style && style.length > 0 && (
                <div className="flex flex-col items-start gap-1">
                  <p className="text-white text-sm font-semibold mb-1">취향 저격! 여행 스타일</p>
                  <div className="flex flex-wrap gap-1 justify-start">
                    {style.split(', ').map((s, idx) => ( // string을 split하여 배열로 사용
                      <Badge
                        key={idx}
                        variant="outline"
                        className="border-blue-500/50 bg-blue-950/50 text-blue-300 text-sm px-3 py-1.5"
                      >
                        <Tag className="w-4 h-4 mr-1" />
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* tendency가 string이므로 split하여 배열로 만든 후 map 사용 */}
              {tendency && tendency.length > 0 && (
                <div className="flex flex-col items-start gap-1">
                  <p className="text-white text-sm font-semibold mb-1">환상의 호흡! 여행 성향</p>
                  <div className="flex flex-wrap gap-1 justify-start">
                    {tendency.split(', ').map((t, idx) => ( // string을 split하여 배열로 사용
                      <Badge
                        key={idx}
                        variant="outline"
                        className="border-purple-500/50 bg-purple-950/50 text-purple-300 text-sm px-3 py-1.5"
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {safeVectorScore !== null && (
                <div className="flex flex-col items-start gap-1">
                  <p className="text-white text-sm font-semibold mb-1">찰떡궁합! 프로필 유사도</p>
                  <Badge
                    variant="outline"
                    className="border-green-500/50 bg-green-950/50 text-green-300 text-sm px-3 py-1.5"
                  >
                    <UserCheck className="w-4 h-4 mr-1" />
                    {safeVectorScore}%
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 정보 영역 */}
      <div className="flex flex-col gap-[10px] w-full">
        <div className="flex flex-col gap-[6px]">
          <h3 className="text-lg font-bold text-black leading-tight truncate">
            {title}
          </h3>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>{renderDateText()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
              <Users className="w-4 h-4 text-gray-500" />
              <span>
                {currentParticipants}/{maxParticipants || 0}명
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
