import { useRef, useState, useEffect } from 'react';
import { WorkspaceCard } from './WorkspaceCard';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from './ui/carousel';
import type { Post } from '../types/post';

interface WorkspaceCarouselProps {
  posts: Post[];
  onCardClick?: (post: Post) => void;
  onEnterClick?: (post: Post) => void;
  showEnterButton?: boolean;
  buttonText?: string;
}

export function WorkspaceCarousel({
  posts,
  onCardClick,
  // onEnterClick,
  // showEnterButton,
  // buttonText,
}: WorkspaceCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetAutoScroll = () => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }

    autoScrollIntervalRef.current = setInterval(() => {
      if (api) {
        api.scrollNext();
      }
    }, 5000); // 5초마다 자동 스크롤
  };

  useEffect(() => {
    if (!api) {
      return;
    }

    resetAutoScroll();

    api.on('select', () => {
      resetAutoScroll();
    });

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [api]);

  return (
    <Carousel
      opts={{
        align: 'start',
        loop: true,
      }}
      setApi={setApi}
      className="w-full"
    >
      <CarouselContent className="-ml-6">
        {posts.map((post) => (
          <CarouselItem
            key={post.id}
            className="pl-6 md:basis-1/2 lg:basis-[40%]"
          >
            <WorkspaceCard post={post} onClick={() => onCardClick?.(post)} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-0" />
      <CarouselNext className="right-0" />
    </Carousel>
  );
}
