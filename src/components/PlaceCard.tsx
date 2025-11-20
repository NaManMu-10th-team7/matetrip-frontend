import { useState, useEffect } from 'react';
import { type PlaceDto } from '../types/place';
import client from '../api/client';

interface PlaceCardProps {
  place: PlaceDto & { recommendationReason?: string };
  onClick: (placeId: string) => void;
}

export function PlaceCard({ place, onClick }: PlaceCardProps) {
  const [actualImageUrl, setActualImageUrl] = useState<string | null>(null);

  // imageUrl이 UUID 형태인지 확인 (해시값)
  const isImageId = place.image_url && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(place.image_url);

  useEffect(() => {
    if (!place.image_url) {
      setActualImageUrl(null);
      return;
    }

    // UUID 형태라면 API로 실제 이미지 URL 가져오기
    if (isImageId) {
      const fetchImageUrl = async () => {
        try {
          const response = await client.get(`/binary-content/${place.image_url}/presigned-url`);
          setActualImageUrl(response.data.url || response.data.presignedUrl || response.data);
        } catch (error) {
          console.error('Failed to fetch image URL for place:', error);
          setActualImageUrl(null);
        }
      };
      fetchImageUrl();
    } else {
      // 이미 URL 형태라면 그대로 사용
      setActualImageUrl(place.image_url);
    }
  }, [place.image_url, isImageId]);

  return (
    <div className="w-full">
      <div
        className="relative w-full aspect-[203/241] rounded-[16px] overflow-hidden cursor-pointer"
        onClick={() => onClick(place.id)}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          {actualImageUrl ? (
            <img
              src={actualImageUrl}
              alt={place.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Place image load failed:', actualImageUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-[#d1d5db]" />
          )}
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end p-[20px]">
          <h3 className="text-[20px] font-bold text-white leading-[1.4] overflow-hidden whitespace-nowrap text-ellipsis">
            {place.title}
          </h3>
        </div>
      </div>

      {/* Recommendation Reason Bubble */}
      {place.recommendationReason && (
        <div className="mt-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200 relative">
          <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
          <p className="text-xs text-gray-700 font-medium">
            💡 {place.recommendationReason}
          </p>
        </div>
      )}
    </div>
  );
}

