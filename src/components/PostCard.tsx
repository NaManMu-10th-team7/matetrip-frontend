import { Calendar, MapPin, Users, Thermometer } from 'lucide-react';
import { type BadgeProps, Badge } from './ui/badge';
import { Card } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Post {
  id: number;
  title: string;
  author: string;
  authorTemp?: number;
  image: string;
  date: string;
  location: string;
  participants: number;
  maxParticipants: number;
  keywords: string[];
  status: '모집중' | '모집완료';
  description: string;
  matchRate?: number;
}

interface PostCardProps {
  post: Post;
  onJoin: (postId: number) => void;
  image?: string;
}

export function PostCard({ post, onJoin, image }: PostCardProps) {
  const getTempColor = (temp: number | undefined) => {
    if (temp >= 38) return 'text-green-600';
    if (temp >= 37) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onJoin(post.id)}
    >
      <div className="relative h-48">
        <ImageWithFallback
          src={image || post.image}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <Badge
          className={`absolute top-3 right-3 ${
            post.status === '모집중' ? 'bg-blue-600' : 'bg-gray-600'
          }`}
        >
          {post.status}
        </Badge>
      </div>

      <div className="p-4">
        <h3 className="text-gray-900 mb-2 line-clamp-1">{post.title}</h3>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full" />
          <span className="text-sm text-gray-600">{post.author}</span>
          {post.authorTemp && (
            <span className={`text-xs ${getTempColor(post.authorTemp)}`}>
              {post.authorTemp}°C
            </span>
          )}
        </div>

        <div className="space-y-2 mb-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{post.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{post.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>
              {post.participants} / {post.maxParticipants}명
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {post.keywords.map((keyword) => (
            <Badge key={keyword} variant="secondary" className="text-xs">
              {keyword}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}
