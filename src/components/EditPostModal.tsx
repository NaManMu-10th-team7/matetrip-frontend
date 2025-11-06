import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Users, Tag } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import type { Post } from './PostCard';
import client from '../api/client';
import { translateKeyword } from '../utils/keyword';

interface EditPostModalProps {
  onClose: () => void;
  onSuccess: () => void;
  post: Post;
}

interface PostData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  maxParticipants: number;
  keywords: string[];
}

const KEYWORD_OPTIONS = [
  { key: 'FOOD', label: '음식' },
  { key: 'ACCOMMODATION', label: '숙박' },
  { key: 'ACTIVITY', label: '액티비티' },
  { key: 'TRANSPORT', label: '교통' },
];

// API 전송을 위해 레이블을 key로 변환하기 위한 맵
const KEYWORD_LABEL_TO_KEY_MAP = Object.fromEntries(
  KEYWORD_OPTIONS.map((opt) => [opt.label, opt.key])
);

export function EditPostModal({
  post,
  onClose,
  onSuccess,
}: EditPostModalProps) {
  const [formData, setFormData] = useState({
    title: post.title,
    content: post.content,
    startDate: post.startDate,
    endDate: post.endDate,
    location: post.location,
    maxParticipants: post.maxParticipants,
  });
  // post.keywords는 ['FOOD'] 형태이므로, 화면 표시를 위해 한글 레이블로 변환합니다.
  const [selectedKeywordLabels, setSelectedKeywordLabels] = useState<string[]>(
    post.keywords.map(translateKeyword)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleKeyword = (keywordLabel: string) => {
    setSelectedKeywordLabels((prev) =>
      prev.includes(keywordLabel)
        ? prev.filter((k) => k !== keywordLabel)
        : [...prev, keywordLabel]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // API 전송을 위해 선택된 한글 레이블을 영문 key로 변환합니다.
    const keywordsForApi = selectedKeywordLabels.map(
      (label) => KEYWORD_LABEL_TO_KEY_MAP[label]
    );

    const updatedPostData = { ...formData, keywords: keywordsForApi };

    try {
      await client.patch(`/post/${post.id}`, updatedPostData);
      // alert('게시물이 성공적으로 수정되었습니다.'); // App.tsx에서 처리하도록 변경
      onSuccess(); // 성공 콜백 호출
    } catch (error) {
      console.error('Failed to update post:', error);
      alert('게시물 수정 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h3 className="text-gray-900">게시물 수정</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">여행 제목</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="mt-2"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">상세 설명</Label>
            <Textarea
              id="description"
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  content: e.target.value,
                }))
              }
              className="mt-2 min-h-32"
              required
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                시작일
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                종료일
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="mt-2"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              여행지
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, location: e.target.value }))
              }
              className="mt-2"
              required
            />
          </div>

          {/* Max Participants */}
          <div>
            <Label
              htmlFor="maxParticipants"
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              최대 인원 (본인 포함)
            </Label>
            <Input
              id="maxParticipants"
              type="number"
              min="2"
              max="10"
              value={formData.maxParticipants}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  maxParticipants: parseInt(e.target.value),
                }))
              }
              className="mt-2"
              required
            />
          </div>

          {/* Keywords */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4" />
              여행 키워드
            </Label>
            <div className="flex flex-wrap gap-2">
              {KEYWORD_OPTIONS.map((keyword) => (
                <Badge
                  key={keyword.key}
                  variant={
                    selectedKeywordLabels.includes(keyword.label)
                      ? 'default'
                      : 'outline'
                  }
                  className={`cursor-pointer transition-colors ${
                    selectedKeywordLabels.includes(keyword.label)
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => toggleKeyword(keyword.label)}
                >
                  {keyword.label}
                </Badge>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? '수정 중...' : '수정 완료'}
          </Button>
        </div>
      </div>
    </div>
  );
}
