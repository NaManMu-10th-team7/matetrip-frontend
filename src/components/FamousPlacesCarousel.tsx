import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PlaceDto } from '../types/place';
import { CATEGORY_INFO } from '../types/place';

interface FamousPlacesCarouselProps {
  places: PlaceDto[];
  onPlaceSelect: (place: PlaceDto) => void;
}

const FamousPlaceCard = ({
  place,
  onSelect,
}: {
  place: PlaceDto;
  onSelect: (place: PlaceDto) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative flex-shrink-0 bg-white rounded-lg shadow-md cursor-pointer transition-all duration-300 ease-in-out overflow-hidden ${
        isHovered ? 'w-56' : 'w-20'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(place)}
    >
      <div className="flex items-start h-20">
        <img
          src={place.image_url}
          alt={place.title}
          className="absolute top-0 left-0 w-20 h-20 object-cover"
        />

        <div className="absolute top-1 right-1 bg-black/50 rounded-full px-1.5 py-0.5 text-white text-xs flex items-center">
          <Star className="w-2.5 h-2.5 text-yellow-400 fill-current mr-0.5" />
          <span className="font-semibold">{place.popularityScore}</span>
        </div>

        {isHovered && (
          <div className="absolute left-20 ml-2.5 py-2.5 pr-2.5 w-[144px]">
            <div className="font-bold truncate text-sm">{place.title}</div>
            <div className="text-xs text-gray-500 truncate">
              {CATEGORY_INFO[place.category as keyof typeof CATEGORY_INFO]
                ?.name || place.category}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const FamousPlacesCarousel = ({
  places,
  onPlaceSelect,
}: FamousPlacesCarouselProps) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount =
        direction === 'left'
          ? -scrollRef.current.offsetWidth
          : scrollRef.current.offsetWidth;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (places.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/10 to-transparent pointer-events-none">
      <div className="relative max-w-4xl mx-auto group pointer-events-auto">
        <button
          onClick={() => scroll('left')}
          className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg hover:bg-white transition-opacity opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2.5 scrollbar-hide"
        >
          {places.map((place) => (
            <FamousPlaceCard
              key={place.id}
              place={place}
              onSelect={onPlaceSelect}
            />
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute -right-5 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg hover:bg-white transition-opacity opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="w-6 h-6 text-gray-800" />
        </button>
      </div>
    </div>
  );
};
