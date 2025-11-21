import React, { useState, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PlaceDto } from '../types/place';
import { CATEGORY_INFO } from '../types/place';

interface FamousPlacesCarouselProps {
  places: PlaceDto[];
  onPlaceSelect: (place: PlaceDto) => void;
}

const BasePlaceCard = ({
  place,
  onHover,
  onClick,
}: {
  place: PlaceDto;
  onHover: (rect: DOMRect | null) => void;
  onClick: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="relative flex-shrink-0 w-20 h-20 cursor-pointer"
      onMouseEnter={() => onHover(ref.current?.getBoundingClientRect() || null)}
      onClick={onClick}
    >
      <div className="w-20 h-20 rounded-lg shadow-md overflow-hidden">
        <img
          src={place.image_url}
          alt={place.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-1 right-1 bg-black/50 rounded-full px-1.5 py-0.5 text-white text-xs flex items-center">
          <Star className="w-2.5 h-2.5 text-yellow-400 fill-current mr-0.5" />
          <span className="font-semibold">{place.popularityScore}</span>
        </div>
      </div>
    </div>
  );
};

const ExpandedPlaceCard = ({
  place,
  rect,
}: {
  place: PlaceDto;
  rect: DOMRect;
}) => {
  if (!rect) return null;

  const style = {
    left: `${rect.left + rect.width / 2}px`,
    top: `${rect.top}px`,
  };

  return (
    <div
      style={style}
      className="fixed -translate-x-1/2 -translate-y-full mb-3 w-56 bg-white rounded-lg shadow-xl z-30 transition-opacity duration-200"
    >
      <div className="flex items-start p-2.5">
        <img
          src={place.image_url}
          alt={place.title}
          className="w-12 h-12 rounded-md object-cover mr-2.5"
        />
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate text-sm">{place.title}</div>
          <div className="text-xs text-gray-500 truncate">
            {CATEGORY_INFO[place.category as keyof typeof CATEGORY_INFO]
              ?.name || place.category}
          </div>
          <div className="flex items-center mt-1.5">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
            <span className="text-xs font-semibold ml-1">
              {place.popularityScore}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FamousPlacesCarousel = ({
  places,
  onPlaceSelect,
}: FamousPlacesCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredPlace, setHoveredPlace] = useState<PlaceDto | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (place: PlaceDto, rect: DOMRect | null) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredPlace(place);
    setHoveredRect(rect);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredPlace(null);
      setHoveredRect(null);
    }, 100);
  };

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
    <>
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-5xl z-10 px-4"
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative bg-gray-100/80 backdrop-blur-sm rounded-xl p-4 group">
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg hover:bg-white transition-opacity opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>

          <div
            ref={scrollRef}
            className="flex items-start gap-3 overflow-x-auto scrollbar-hide"
          >
            {places.map((place) => (
              <BasePlaceCard
                key={place.id}
                place={place}
                onHover={(rect) => handleMouseEnter(place, rect)}
                onClick={() => onPlaceSelect(place)}
              />
            ))}
          </div>

          <button
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg hover:bg-white transition-opacity opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-6 h-6 text-gray-800" />
          </button>
        </div>
      </div>
      {hoveredPlace && hoveredRect && (
        <ExpandedPlaceCard place={hoveredPlace} rect={hoveredRect} />
      )}
    </>
  );
};
