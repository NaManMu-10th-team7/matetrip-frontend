import { Skeleton } from '../components/ui/skeleton';

export function PostDetailSkeleton() {
  return (
    <div className="absolute inset-0 flex flex-col rounded-lg overflow-hidden">
      {/* 헤더 스켈레톤 */}
      <div className="relative flex-shrink-0">
        <Skeleton className="w-full h-[320px]" />
        <div className="absolute inset-0 flex flex-col justify-between p-6">
          <div className="flex justify-between items-start">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="w-12 h-12 rounded-full" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2 w-3/4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-1/2" />
            </div>
            <div className="flex flex-col items-center gap-3 w-full">
              <Skeleton className="h-6 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 본문 스켈레톤 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <div className="p-8">
          {/* 작성자 정보 스켈레톤 */}
          <div className="mb-6 p-4 rounded-xl border shadow-md">
            <div className="flex items-start gap-4">
              <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-8 w-24 rounded-md" />
                </div>
                <Skeleton className="h-5 w-32" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-7 w-24 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* 여행 소개 스켈레톤 */}
          <div className="mb-6 rounded-xl border p-6 space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          {/* 동행 목록 스켈레톤 */}
          <div className="grid grid-cols-2 gap-8">
            {/* 확정된 동행 */}
            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <div className="p-3 rounded-xl border space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-7 w-20 rounded-md" />
                </div>
              </div>
              <div className="p-3 rounded-xl border space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-7 w-20 rounded-md" />
                </div>
              </div>
            </div>

            {/* 대기중인 동행 */}
            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <div className="p-4 rounded-xl border text-center">
                <Skeleton className="h-5 w-48 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 버튼 스켈레톤 */}
      <div className="p-6 bg-white border-t border-gray-200">
        <Skeleton className="h-16 w-full rounded-full" />
      </div>
    </div>
  );
}