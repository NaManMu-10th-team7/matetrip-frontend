import { ImageWithFallback } from './figma/ImageWithFallback';
import { MapPin, Calendar, CheckCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress'; // shadcn/ui의 Progress 컴포넌트를 import합니다.
import type { Post } from '../types/post';
import type { MatchingInfo } from '../types/matching';

interface MatchingCardProps {
  /** 기존 WorkspaceCard와 동일한 Post 데이터 */
  post: Post;
  /** 이 카드에만 필요한 매칭 점보 */
  matchingInfo: MatchingInfo;
  /** 카드 클릭 이벤트 핸들러 */
  onClick?: () => void;
}

const coverImage = 'https://via.placeholder.com/400x300';

/**
 * 이미지에 표시된 '매칭 스코어' 기반의 추천 카드를 렌더링하는 컴포넌트입니다.
 * WorkspaceCard의 기본 골격(props, 스타일)을 따릅니다.
 */
export function MatchingCard({
  post,
  matchingInfo,
  onClick,
}: MatchingCardProps) {
  const { title, location, startDate, endDate, status } = post;
  const { score, tendency, style, vectorscore } = matchingInfo;
  const formatMatchText = (value?: string, fallback = ' [ ]') =>
    value && value.trim().length > 0 ? value : fallback;

  // WorkspaceCard에서 가져온 총 일수 계산 함수
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // 커버 텍스트 (예: "일본 오사카" -> "오사카")
  // 이미지에는 "Osaka"로 되어있으나, 데이터("일본 오사카")를 따르는 것이 좋습니다.
  //const coverText = location.split(' ').pop() || 'Trip';

  return (
    <div
      className="bg-white rounded-2xl shadow-lg overflow-hidden mx-4 hover:shadow-xl transition-shadow cursor-pointer relative h-full flex flex-col"
      onClick={onClick}
    >
      {/* 1. 상태 배지 (WorkspaceCard와 동일) */}
      {status && (
        <Badge
          className="absolute top-4 right-4 z-10 px-3 py-1 text-sm font-semibold"
          variant={status === '모집중' ? 'default' : 'secondary'}
        >
          {status}
        </Badge>
      )}

      {/* 2. 커버 영역 (이미지 디자인 적용) */}

      {/* 커버 이미지 */}
      <div className="h-48 overflow-hidden flex-shrink-0">
        <ImageWithFallback
          src={coverImage}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* 3. 콘텐츠 영역 */}
      <div className="p-6 space-y-3 flex flex-col flex-grow">
        {/* 제목 (WorkspaceCard와 동일) */}
        {/* 이미지처럼 제목에 기간이 포함되어 있다면 title prop에 이미 포함되어야 합니다. */}
        <h3 className="text-gray-900 text-xl font-bold truncate">{title}</h3>

        {/* 여행지 (WorkspaceCard와 동일) */}
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>

        {/* 여행 기간 (WorkspaceCard와 동일) */}
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            {startDate} ~ {endDate} ({calculateDays()}일)
          </span>
        </div>

        {/* 4. 매칭 스코어 (새로 추가된 섹션) */}
        <div className="pt-4 space-y-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold text-gray-800">
              매칭 스코어
            </span>
            <span className="text-xl font-bold text-green-600">{score}%</span>
          </div>
          {/* Progress 컴포넌트 (shadcn/ui) */}
          {/* 초록색으로 표시하기 위해 JIT 클래스 사용 */}
          <Progress value={score} className="h-2 w-full [&>div]:bg-green-600" />
        </div>

        {/* 5. 매칭 이유 (새로 추가된 섹션) */}
        <div className="mt-3 bg-green-50 p-4 rounded-lg space-y-2.5">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700">
              여행 성향:
              <span className="font-semibold text-gray-900">
                {' '}
                {formatMatchText(tendency)}
              </span>
              이(가) 동일해요
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700">
              여행 스타일:
              <span className="font-semibold text-gray-900">
                {' '}
                {formatMatchText(style)}
              </span>
              이(가) 동일해요
            </span>
          </div>
          {vectorscore !== undefined && (
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">
                프로필 유사도가
                <span className="font-semibold text-gray-900">
                  {' '}
                  {vectorscore}%
                </span>
                예요
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
