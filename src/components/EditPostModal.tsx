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
  //console.log('EditPostModal post.imageId:', post);
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
    post.imageId ?? null //imageId는 따로 관리
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
        const response = await client.get<{ url: string }>(
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
  //displayImage는 먼저 imagePreview(방금 선택한 새 파일의 로컬 미리보기 URL)가 있으면 그걸 쓰고, 없으면
  //  remoteImageUrl(기존 게시물이 갖고 있던 imageId로 받은 presigned URL)을 보여주는 순서
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
    //기존꺼 지우고 새 이미지 미리보기 만들기
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
      // alert('게시물이 성공적으로 수정되었습니다.'); // App.tsx에서 처리하도록 변경
      setPendingImageFile(null);
      updateImagePreview(null);
      setCurrentImageId(nextImageId ?? null);
      onSuccess(); // 성공 콜백 호출
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
          {/* Cover Image */}
          <div className="space-y-3">
            <Label className="block">대표 이미지</Label>
            <div className="relative h-48 rounded-2xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400 overflow-hidden">
              {displayImage ? (
                <>
                  <img
                    src={displayImage}
                    alt="게시글 이미지 미리보기"
                    className="inset-0 w-full h-full object-cover"
                  />
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-400 mb-3" />
                  <p className="font-semibold text-gray-600">이미지 업로드</p>
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
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={handleImageUploadClick}
                disabled={isSubmitting}
              >
                {displayImage ? '이미지 수정' : '이미지 등록'}
              </Button>
              {displayImage && (
                <Button
                  type="button"
                  variant="ghost"
                  className="flex items-center gap-2 text-red-500 hover:text-red-600"
                  onClick={handleRemoveImage}
                  disabled={isSubmitting || isImageDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                  이미지 제거
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500">
              최대 50MB 이하의 JPG, PNG 이미지를 권장합니다.
            </p>
          </div>
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
                  key={keyword.value}
                  variant={
                    selectedKeywords.includes(keyword.value)
                      ? 'default'
                      : 'outline'
                  }
                  className={`cursor-pointer transition-colors ${
                    selectedKeywords.includes(keyword.value)
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => toggleKeyword(keyword.value)}
                >
                  {keyword.label}
                </Badge>
              ))}
            </div>
          </div>
        </form>

        {errorMessage && (
          <div className="px-6 pb-2 text-sm text-red-500 text-right">
            {errorMessage}
          </div>
        )}

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
