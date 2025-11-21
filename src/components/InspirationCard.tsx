import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import client from '../api/client';
import { CategoryIcon } from './CategoryIcon'; // CategoryIcon 임포트

interface InspirationCardProps {
  imageUrl?: string;
  badgeText?: string;
  title: string;
  category?: string; // category prop 추가
  address: string;
  onClick?: () => void;
  isLoading?: boolean;
}

export function InspirationCard({
  imageUrl,
  badgeText = '현재 가장 인기있는 숙소 TOP. 1',
  title,
  category,
  address,
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
          className="h-[252px] rounded-2xl w-full bg-cover bg-center"
          style={{
            backgroundColor:
              !actualImageUrl || isImageLoading ? '#E5E7EB' : undefined,
            backgroundImage:
              actualImageUrl && !isImageLoading
                ? `url(${actualImageUrl})`
                : undefined,
          }}
        />
        <p className="font-medium text-xs text-black leading-4 overflow-hidden whitespace-nowrap text-ellipsis w-full">
          {badgeText}
        </p>
      </div>

      <div className="flex flex-col gap-1.5 items-start w-full">
        <h3 className="font-bold text-lg text-black leading-[1.4] w-full overflow-hidden whitespace-nowrap text-ellipsis">
          {title}
        </h3>
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
      </div>
    </div>
  );
}
