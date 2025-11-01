import { useState } from 'react';
import { X, Calendar, MapPin, Users, Tag } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';

interface EditPostModalProps {
  postId: number;
  onClose: () => void;
}

const KEYWORD_OPTIONS = [
  '힐링',
  '액티브',
  '맛집투어',
  '사진',
  '자연',
  '도시',
  '해변',
  '산',
  '카페',
  '쇼핑',
];

// Mock data - 실제로는 postId로 데이터를 가져옴
const MOCK_POST_DATA = {
  title: '제주도 힐링 여행 같이 가실 분 🌊',
  description: '제주도에서 여유롭게 힐링하면서 맛집도 탐방할 분들 구합니다!',
  startDate: '2025-11-15',
  endDate: '2025-11-18',
  location: '제주도',
  maxParticipants: 4,
  keywords: ['힐링', '자연', '맛집투어'],
};

export function EditPostModal({ postId, onClose }: EditPostModalProps) {
  const [formData, setFormData] = useState(MOCK_POST_DATA);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(
    MOCK_POST_DATA.keywords
  );

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Updated post:', { ...formData, keywords: selectedKeywords });
    onClose();
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
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
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
                  key={keyword}
                  variant={
                    selectedKeywords.includes(keyword) ? 'default' : 'outline'
                  }
                  className={`cursor-pointer transition-colors ${
                    selectedKeywords.includes(keyword)
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => toggleKeyword(keyword)}
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white">
          <Button variant="outline" onClick={onClose} className="flex-1">
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            수정 완료
          </Button>
        </div>
      </div>
    </div>
  );
}
