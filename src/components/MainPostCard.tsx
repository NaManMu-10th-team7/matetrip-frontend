import { Calendar, MapPin } from 'lucide-react';
import { type Post } from '../types/post';
import { Badge } from './ui/badge';
import { Card } from './ui/card';

interface MainPostCardProps {
  post: Post;
  onClick: (postId: string) => void;
}

// 백엔드에서 받은 영문 키워드를 한글로 변환하기 위한 맵
const KEYWORD_MAP: { [key: string]: string } = {
  FOOD: '음식',
  ACCOMMODATION: '숙박',
  ACTIVITY: '액티비티',
  TRANSPORT: '교통',
};

const translateKeyword = (keyword: string) => KEYWORD_MAP[keyword] || keyword;

export function MainPostCard({ post, onClick }: MainPostCardProps) {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case '모집중':
        return 'bg-blue-100 text-blue-800';
      case '모집완료':
        return 'bg-gray-100 text-gray-800';
      case '여행중':
        return 'bg-green-100 text-green-800';
      case '여행완료':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card
      className="p-6 hover:shadow-lg transition-shadow cursor-pointer flex flex-col justify-between"
      onClick={() => onClick(post.id)}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-gray-900 flex-1 pr-4 break-words">
            {post.title}
          </h3>
          <Badge className={getStatusBadgeClass(post.status)}>{post.status}</Badge>
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>{post.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>{`${post.startDate} ~ ${post.endDate}`}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {post.keywords.map((keyword) => (
          <Badge key={keyword} variant="secondary">
            {translateKeyword(keyword)}
          </Badge>
        ))}
      </div>
    </Card>
  );
}