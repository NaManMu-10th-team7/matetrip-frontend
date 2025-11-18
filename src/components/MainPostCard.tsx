import { useState, useEffect } from 'react';
import { type Post } from '../types/post';
import client from '../api/client';

interface MainPostCardProps {
  post: Post;
  matchingScore?: number;
  imageUrl?: string;
  onClick: (postId: string) => void;
}

export function MainPostCard({ 
  post, 
  matchingScore, 
  imageUrl, 
  onClick 
}: MainPostCardProps) {
  const [isHovered, setIsHovered] = useState(false);
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
          console.error('Failed to fetch image URL:', error);
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
      className="relative w-full aspect-[203/241] rounded-[16px] overflow-hidden cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        console.log('🔵 MainPostCard 클릭됨!', { 
          postId: post.id, 
          postTitle: post.title,
          event: e 
        });
        onClick(post.id);
        console.log('🔵 onClick 함수 호출 완료');
      }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {actualImageUrl ? (
          <img
            src={actualImageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Image load failed:', actualImageUrl);
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
        {/* Default State: Title */}
        <div
          className={`transition-all duration-300 ${
            isHovered ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <h3 className="text-[20px] font-bold text-white leading-[1.4] overflow-hidden whitespace-nowrap text-ellipsis">
            {post.title}
          </h3>
        </div>

        {/* Hover State: Matching Score */}
        <div
          className={`absolute bottom-[20px] left-[20px] right-[20px] transition-all duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-end justify-between">
            <p className="text-[16px] font-medium text-white leading-[1.6]">
              매칭율
            </p>
            <div className="flex items-start text-white">
              <span className="text-[24px] font-bold leading-[1.4]">
                {matchingScore ?? 0}
              </span>
              <span className="text-[14px] font-medium leading-[1.2]">
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

