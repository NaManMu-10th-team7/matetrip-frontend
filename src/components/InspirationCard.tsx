import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import client from '../api/client';

interface InspirationCardProps {
  imageUrl?: string;
  badgeText?: string;
  title: string;
  address: string;
  onClick?: () => void;
}

export function InspirationCard({
  imageUrl,
  badgeText = '현재 가장 인기있는 숙소 TOP. 1',
  title,
  address,
  onClick,
}: InspirationCardProps) {
  const [actualImageUrl, setActualImageUrl] = useState<string | null>(null);

  // imageUrl이 UUID 형태인지 확인 (해시값)
  const isImageId = imageUrl && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(imageUrl);

  useEffect(() => {
    if (!imageUrl) {
      setActualImageUrl(null);
      return;
    }

    // UUID 형태라면 API로 실제 이미지 URL 가져오기
    if (isImageId) {
      const fetchImageUrl = async () => {
        try {
          const response = await client.get(`/binary-content/${imageUrl}/presigned-url`);
          setActualImageUrl(response.data.url || response.data.presignedUrl || response.data);
        } catch (error) {
          console.error('Failed to fetch image URL for inspiration:', error);
          setActualImageUrl(null);
        }
      };
      fetchImageUrl();
    } else {
      // 이미 URL 형태라면 그대로 사용
      setActualImageUrl(imageUrl);
    }
  }, [imageUrl, isImageId]);

  return (
    <div
      className="flex flex-col gap-3 items-start w-full cursor-pointer"
      onClick={onClick}
    >
      {/* 이미지 및 배지 영역 */}
      <div className="flex flex-col gap-3 items-start justify-end w-full">
        <div
          className="h-[252px] rounded-2xl w-full bg-cover bg-center"
          style={{
            backgroundColor: actualImageUrl ? undefined : 'rgba(246, 51, 154, 0.6)',
            backgroundImage: actualImageUrl ? `url(${actualImageUrl})` : undefined,
          }}
        />
        <p className="font-medium text-xs text-black leading-4 overflow-hidden whitespace-nowrap text-ellipsis w-full">
          {badgeText}
        </p>
      </div>

      {/* 제목 및 주소 영역 */}
      <div className="flex flex-col gap-5 items-start w-full">
        <div className="flex flex-col gap-1.5 items-start w-full">
          <h3 className="font-bold text-lg text-black leading-[1.4] w-full overflow-hidden whitespace-nowrap text-ellipsis">
            {title}
          </h3>
          <div className="flex items-center gap-1 w-full">
            <MapPin className="w-5 h-5 text-black flex-shrink-0" />
            <p className="font-medium text-sm text-black leading-[1.6] overflow-hidden whitespace-nowrap text-ellipsis">
              {address}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
