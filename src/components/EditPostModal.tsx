import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { X, Calendar, MapPin, Users, Tag, Upload, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import type { Post } from '../types/post';
import client from '../api/client';
import { KEYWORD_OPTIONS, type KeywordValue } from '../utils/keyword';
import { API_BASE_URL } from '../api/client';

interface EditPostModalProps {
  onClose: () => void;
  onSuccess: () => void;
  post: Post;
}

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
  const initialKeywords = (post.keywords ?? []) as KeywordValue[];
  const [selectedKeywords, setSelectedKeywords] =
    useState<KeywordValue[]>(initialKeywords);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageId, setCurrentImageId] = useState<string | null>(
    post.imageId ?? null
  );
  const [remoteImageUrl, setRemoteImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImageDeleting, setIsImageDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const toggleKeyword = (keyword: KeywordValue) => {
    setSelectedKeywords((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword]
    );
  };

  useEffect(() => {
    let cancelled = false;
    if (!currentImageId) {
      setRemoteImageUrl(null);
      return;
    }

    (async () => {
      try {
        const response = await client.get<{ url:string }>(
          `/binary-content/${currentImageId}/presigned-url`
        );
        if (!cancelled) {
          setRemoteImageUrl(response.data.url);
        }
      } catch (error) {
        console.error('게시글 이미지 URL 불러오기 실패:', error);
        if (!cancelled) {
          setRemoteImageUrl(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentImageId]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const displayImage = imagePreview ?? remoteImageUrl;

  const updateImagePreview = (nextUrl: string | null) => {
    setImagePreview((prev) => {
      if (prev && prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return nextUrl;
    });
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingImageFile(file);
    updateImagePreview(URL.createObjectURL(file));
    event.target.value = '';
  };

  const uploadImageFile = async (file: File) => {
    const safeFileType = file.type || 'application/octet-stream';
    const presignResponse = await fetch(
      `${API_BASE_URL}/binary-content/presigned-url`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: safeFileType,
        }),
      }
    );
    if (!presignResponse.ok) {
      throw new Error('이미지 업로드 URL 생성에 실패했습니다.');
    }
    const { uploadUrl, binaryContentId } = await presignResponse.json();
    const s3Response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': safeFileType },
    });
    if (!s3Response.ok) {
      throw new Error('이미지 업로드에 실패했습니다.');
    }
    return binaryContentId as string;
  };

  const handleRemoveImage = async () => {
    if (pendingImageFile) {
      setPendingImageFile(null);
      updateImagePreview(null);
      return;
    }

    if (isImageDeleting || !currentImageId) {
      return;
    }

    setIsImageDeleting(true);
    try {
      await fetch(`${API_BASE_URL}/binary-content/${currentImageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setCurrentImageId(null);
      setPendingImageFile(null);
      updateImagePreview(null);
      setRemoteImageUrl(null);
    } catch (error) {
      console.error('이미지 삭제 실패:', error);
      setErrorMessage('이미지 삭제 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsImageDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    let nextImageId = currentImageId;

    try {
      if (pendingImageFile) {
        nextImageId = await uploadImageFile(pendingImageFile);
      }
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '이미지 업로드 중 오류가 발생했습니다.'
      );
      setIsSubmitting(false);
      return;
    }

    const updatedPostData = {
      ...formData,
      keywords: selectedKeywords,
      imageId: nextImageId,
    };

    try {
      await client.patch(`/posts/${post.id}`, updatedPostData);
      setPendingImageFile(null);
      updateImagePreview(null);
      setCurrentImageId(nextImageId ?? null);
      onSuccess();
    } catch (error) {
      console.error('Failed to update post:', error);
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        setErrorMessage('게시물 작성에 실패하였습니다.');
      } else {
        setErrorMessage('게시물 수정 중 오류가 발생했습니다. 다시 시도해 주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-900">게시물 수정</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Cover Image */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-800">대표 이미지</Label>
              <div className="relative h-56 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400 overflow-hidden">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt="게시글 이미지 미리보기"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-400 mb-3" />
                    <p className="font-semibold text-gray-600">이미지를 업로드 해주세요</p>
                    <p className="text-sm text-gray-500 mt-1">최대 50MB 이하</p>
                  </>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelected}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="font-semibold"
                  onClick={handleImageUploadClick}
                  disabled={isSubmitting}
                >
                  {displayImage ? '이미지 변경' : '이미지 선택'}
                </Button>
                {displayImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="font-semibold text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleRemoveImage}
                    disabled={isSubmitting || isImageDeleting}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    이미지 제거
                  </Button>
                )}
              </div>
            </div>
            
            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-base font-semibold text-gray-800">여행 제목</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="mt-2 text-base"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-base font-semibold text-gray-800">상세 설명</Label>
              <Textarea
                id="description"
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                className="mt-2 min-h-36 text-base"
                required
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="flex items-center gap-2 text-base font-semibold text-gray-800">
                  <Calendar className="w-5 h-5 text-gray-500" />
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
                  className="mt-2 text-base"
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="flex items-center gap-2 text-base font-semibold text-gray-800">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  종료일
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className="mt-2 text-base"
                  required
                />
              </div>
            </div>

            {/* Location & Max Participants */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location" className="flex items-center gap-2 text-base font-semibold text-gray-800">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  여행지
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, location: e.target.value }))
                  }
                  className="mt-2 text-base"
                  required
                />
              </div>
              <div>
                <Label
                  htmlFor="maxParticipants"
                  className="flex items-center gap-2 text-base font-semibold text-gray-800"
                >
                  <Users className="w-5 h-5 text-gray-500" />
                  최대 인원
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
                  className="mt-2 text-base"
                  required
                />
              </div>
            </div>

            {/* Keywords */}
            <div>
              <Label className="flex items-center gap-2 mb-3 text-base font-semibold text-gray-800">
                <Tag className="w-5 h-5 text-gray-500" />
                여행 키워드
              </Label>
              <div className="flex flex-wrap gap-2">
                {KEYWORD_OPTIONS.map((keyword) => (
                  <Badge
                    key={keyword.value}
                    variant={
                      selectedKeywords.includes(keyword.value)
                        ? 'default'
                        : 'outline'
                    }
                    className={`cursor-pointer transition-all duration-200 text-sm font-semibold ${
                      selectedKeywords.includes(keyword.value)
                        ? 'bg-black text-white hover:bg-gray-800'
                        : 'text-gray-600 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                    }`}
                    onClick={() => toggleKeyword(keyword.value)}
                  >
                    {keyword.label}
                  </Badge>
                ))}
              </div>
            </div>
          </form>
        </div>

        {errorMessage && (
          <div className="px-6 pb-4 text-sm font-medium text-red-600 text-right">
            {errorMessage}
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t sticky bottom-0 bg-gray-50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 font-bold text-lg"
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-black hover:bg-gray-800 text-white font-bold text-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? '수정 중...' : '수정 완료'}
          </Button>
        </div>
      </div>
    </div>
  );
}
