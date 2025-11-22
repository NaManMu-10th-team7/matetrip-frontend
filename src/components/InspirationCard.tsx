import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import client from '../api/client';
import { CategoryIcon } from './CategoryIcon'; // CategoryIcon 임포트

interface InspirationCardProps {
  imageUrl?: string;
  rank?: number; // badgeText 대신 rank prop 추가
  title: string;
  category?: string;
  address: string;
  summary?: string;
  onClick?: () => void;
  isLoading?: boolean;
}

// 메달 아이콘 컴포넌트
const MedalIcon = ({ rank }: { rank: number }) => {
  let bgColor = '';
  let textColor = 'text-white';
  let iconText = '';

  if (rank === 1) {
    bgColor = 'bg-yellow-500'; // Gold
    iconText = '1st';
  } else if (rank === 2) {
    bgColor = 'bg-gray-400'; // Silver
    iconText = '2nd';
  } else if (rank === 3) {
    bgColor = 'bg-amber-700'; // Bronze
    iconText = '3rd';
  } else {
    return null; // Only show for top 3
  }

  return (
    <div
      className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${bgColor} ${textColor} shadow-md z-10`}
    >
      {iconText}
    </div>
  );
};

export function InspirationCard({
  imageUrl,
  rank, // rank prop 사용
  title,
  category,
  address,
  summary,
  onClick,
  isLoading = false,
}: InspirationCardProps) {
  const [actualImageUrl, setActualImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const isImageId =
    imageUrl &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      imageUrl
    );

  useEffect(() => {
    if (!imageUrl) {
      setActualImageUrl(null);
      setIsImageLoading(false);
      return;
    }

    setIsImageLoading(true);
    if (isImageId) {
      const fetchImageUrl = async () => {
        try {
          const response = await client.get(
            `/binary-content/${imageUrl}/presigned-url`
          );
          setActualImageUrl(
            response.data.url || response.data.presignedUrl || response.data
          );
        } catch (error) {
          console.error('Failed to fetch image URL for inspiration:', error);
          setActualImageUrl(null);
        } finally {
          setIsImageLoading(false);
        }
      };
      fetchImageUrl();
    } else {
      setActualImageUrl(imageUrl);
      setIsImageLoading(false);
    }
  }, [imageUrl, isImageId]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 items-start w-full animate-pulse">
        <div className="h-[252px] rounded-2xl w-full bg-gray-200"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-6 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mt-1"></div> {/* 카테고리 스켈레톤 */}
        <div className="flex items-center gap-1 w-full">
          <div className="w-5 h-5 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-start w-full cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col gap-3 items-start justify-end w-full">
        <div
          className="h-[252px] rounded-2xl w-full bg-cover bg-center relative overflow-hidden"
          style={{
            backgroundColor:
              !actualImageUrl || isImageLoading ? '#E5E7EB' : undefined,
            backgroundImage:
              actualImageUrl && !isImageLoading
                ? `url(${actualImageUrl})`
                : undefined,
          }}
        >
          {rank && <MedalIcon rank={rank} />} {/* 메달 아이콘 표시 */}
          {/* 이미지 위에 장소 이름 표시 */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent rounded-b-2xl">
            <h3 className="font-bold text-lg text-white leading-[1.4] w-full overflow-hidden whitespace-nowrap text-ellipsis">
              {title}
            </h3>
          </div>
        </div>
        {/* badgeText 제거 */}
      </div>

      <div className="flex flex-col gap-1.5 items-start w-full pt-2"> {/* padding-top 추가 */}
        {category && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <CategoryIcon category={category} className="w-4 h-4" />
            <span>{category}</span>
          </div>
        )}
        <div className="flex items-center gap-1 w-full">
          <MapPin className="w-5 h-5 text-black flex-shrink-0" />
          <p className="font-medium text-sm text-black leading-[1.6] overflow-hidden whitespace-nowrap text-ellipsis">
            {address}
          </p>
        </div>
        {summary && ( // summary를 주소 아래로 이동
          <p className="text-sm text-gray-600 leading-[1.6] line-clamp-2">
            {summary}
          </p>
        )}
      </div>
    </div>
  );
}
