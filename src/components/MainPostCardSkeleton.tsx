import { Card } from './ui/card';
import { Skeleton } from './ui/skeleton';

/**
 * MainPostCard의 레이아웃을 모방한 스켈레톤 컴포넌트입니다.
 * 로딩 중일 때 사용자에게 보여줄 플레이스홀더 역할을 합니다.
 * 각 Skeleton 요소에 animation-delay를 적용하여 순차적으로 나타나는 듯한 효과를 줍니다.
 */
export function MainPostCardSkeleton() {
  return (
    <Card className="p-6 flex flex-col justify-between">
      <div>
        <div className="mb-3">
          <div className="flex justify-between items-start mb-2">
            {/* Title Skeleton */}
            <Skeleton className="h-6 w-3/4" />
            {/* Status Badge Skeleton */}
            <Skeleton className="h-6 w-16" />
          </div>
          {/* Writer Nickname Skeleton */}
          <Skeleton className="h-4 w-1/3" />
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          {/* Location Skeleton */}
          <Skeleton className="h-4 w-1/2" />
          {/* Date Skeleton */}
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Keyword Badges Skeleton */}
        <Skeleton
          className="h-6 w-20 rounded-full"
        />
        <Skeleton
          className="h-6 w-24 rounded-full"
        />
      </div>
    </Card>
  );
}
