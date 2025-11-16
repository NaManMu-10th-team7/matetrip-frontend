import { MapPin } from 'lucide-react';

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
            backgroundColor: imageUrl ? undefined : 'rgba(246, 51, 154, 0.6)',
            backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          }}
        />
        <p className="font-medium text-xs text-black leading-4">
          {badgeText}
        </p>
      </div>

      {/* 제목 및 주소 영역 */}
      <div className="flex flex-col gap-5 items-start w-full">
        <div className="flex flex-col gap-1.5 items-start w-full">
          <h3 className="font-bold text-2xl text-black leading-[1.4] w-full">
            {title}
          </h3>
          <div className="flex items-center gap-1 w-full">
            <MapPin className="w-5 h-5 text-black flex-shrink-0" />
            <p className="font-medium text-base text-black leading-[1.6]">
              {address}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
