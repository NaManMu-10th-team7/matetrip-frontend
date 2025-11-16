import { MapPin, PlusCircle } from 'lucide-react';
import { type AiPlace } from '../hooks/useChatSocket';
import { Button } from './ui/button';

interface RecommendedPlaceCardProps {
  place: AiPlace;
}

export function RecommendedPlaceCard({ place }: RecommendedPlaceCardProps) {
  const handleAddClick = () => {
    // TODO: '일정에 추가' 또는 '마커 보관함에 추가' 기능 구현
    // 예: usePoiSocket의 markPoi 함수 호출
    alert(`'${place.title}'을(를) 일정에 추가하는 기능은 구현 예정입니다.`);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 flex gap-3 text-gray-900 shadow-sm">
      {place.image_url && (
        <img
          src={place.image_url}
          alt={place.title}
          className="w-20 h-20 rounded-md object-cover flex-shrink-0"
        />
      )}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <p className="font-semibold truncate text-sm">{place.title}</p>
          <div className="flex items-start gap-1 text-xs text-gray-500 mt-1">
            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <p className="truncate">{place.address}</p>
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 text-blue-600 hover:text-blue-700"
            onClick={handleAddClick}
          >
            <PlusCircle className="w-4 h-4" />
            <span className="text-xs">일정에 추가</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
