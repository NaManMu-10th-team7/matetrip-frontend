import {
  useState,
  type FormEvent,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import axios from 'axios';
import {
  X,
  Calendar,
  MapPin,
  Users,
  Tag,
  Upload,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useAuthStore } from '../store/authStore';
import client, { API_BASE_URL } from '../api/client';
import { KEYWORD_OPTIONS, type KeywordValue } from '../utils/keyword';
// import { toast } from 'sonner'; // toast import 제거

interface CreatePostModalProps {
  onClose: () => void;
  // 게시글 생성 성공 시 호출될 콜백 함수
  onPostCreated?: () => void;
}

interface Region {
  key: string;
  value: string;
}

interface PostData {
  title: string;
  content: string;
  startDate: string;
  endDate: string;
  location: string;
  maxParticipants: number;
  keywords: KeywordValue[];
  imageId: string | null;
}

/**
 * 동행 모집 게시글을 생성하는 API를 호출
 * @param postData 게시글 데이터
 */
async function createPost(postData: PostData) {
  // HttpOnly 쿠키 인증을 위해 기존 fetch 대신 client(axios instance)를 사용합니다.
  // withCredentials: true 설정 덕분에 쿠키가 자동으로 요청에 포함됩니다.
  const response = await client.post('/posts', postData);
  return response.data;
}

/**
 * Presigned URL을 받아 이미지를 S3에 업로드하고, 생성된 binaryContentId를 반환
 * @param file 업로드할 이미지 파일
 */
async function uploadImageFile(file: File) {
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
    headers: {
      'Content-Type': safeFileType,
    },
  });
  if (!s3Response.ok) {
    throw new Error('이미지 업로드에 실패했습니다.');
  }
  return binaryContentId as string;
}

export function CreatePostModal({
  onClose,
  onPostCreated,
}: CreatePostModalProps) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    startDate: '',
    endDate: '',
    location: '',
    maxParticipants: 2,
  });
  const [regions, setRegions] = useState<Region[]>([]);
  const [isRegionsLoading, setIsRegionsLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<KeywordValue[]>([]);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateImagePreview = useCallback((nextUrl: string | null) => {
    setImagePreview((prev) => {
      if (prev && prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return nextUrl;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        setIsRegionsLoading(true);
        const response = await client.get<Region[]>('/places/regions');
        setRegions(response.data);
      } catch (error) {
        console.error('Failed to fetch regions:', error);
        setErrorMessage('지역 정보를 불러오는 데 실패했습니다.');
      } finally {
        setIsRegionsLoading(false);
      }
    };
    fetchRegions();
  }, []);

  const toggleKeyword = useCallback((keyword: KeywordValue) => {
    setSelectedKeywords((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword]
    );
  }, []);

  const handleImageUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageSelected = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setPendingImageFile(file);
      updateImagePreview(URL.createObjectURL(file));
      event.target.value = '';
    },
    [updateImagePreview]
  );

  const handleRemoveImage = useCallback(() => {
    setPendingImageFile(null);
    updateImagePreview(null);
  }, [updateImagePreview]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setErrorMessage('');

      if (!user) {
        setErrorMessage('로그인이 필요합니다. 다시 로그인해주세요.');
        return;
      }

      if (
        formData.startDate &&
        formData.endDate &&
        formData.startDate > formData.endDate
      ) {
        setErrorMessage('종료일은 시작일보다 이후여야 합니다.');
        return;
      }

      setIsLoading(true);
      let imageId: string | null = null;

      try {
        if (pendingImageFile) {
          imageId = await uploadImageFile(pendingImageFile);
        }
      } catch (error) {
        console.error('이미지 업로드 실패:', error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '이미지 업로드 중 오류가 발생했습니다.'
        );
        setIsLoading(false);
        return;
      }

      const postData: PostData = {
        ...formData,
        keywords: selectedKeywords,
        imageId,
      };

      try {
        await createPost(postData);
        // toast.success('동행 모집 게시글이 작성되었습니다.'); // 중복 알림 방지를 위해 제거

        onClose(); // 성공 시 모달 닫기
        onPostCreated?.(); // 부모 컴포넌트에 알림
      } catch (error) {
        console.error('Error creating post:', error);
        if (axios.isAxiosError(error) && error.response?.status === 400) {
          setErrorMessage('입력 내용을 다시 확인해주세요.');
        } else {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : '게시물 작성 중 오류가 발생했습니다. 다시 시도해 주세요.'
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [user, formData, pendingImageFile, selectedKeywords, onClose, onPostCreated]
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-900">동행 모집하기</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form
          id="create-post-form"
          onSubmit={handleSubmit}
          className="p-6 space-y-6"
        >
          {/* Cover Image */}
          <div className="space-y-3">
            <Label>대표 이미지</Label>
            <div className="relative h-48 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400 overflow-hidden">
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="게시글 이미지 미리보기"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="font-medium text-sm text-gray-600">
                    클릭 또는 드래그하여 이미지 업로드
                  </p>
                  <span className="text-xs text-gray-500">
                    최대 50MB, JPG/PNG
                  </span>
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
                variant="default"
                onClick={handleImageUploadClick}
                disabled={isLoading}
              >
                <Upload />
                {imagePreview ? '이미지 변경' : '이미지 선택'}
              </Button>
              {imagePreview && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleRemoveImage}
                  disabled={isLoading}
                >
                  <Trash2 />
                  제거
                </Button>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">여행 제목</Label>
            <Input
              id="title"
              placeholder="예) 제주도 힐링 여행 같이 가실 분 🌊"
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
              placeholder="여행 계획과 동행에게 바라는 점을 자유롭게 작성해주세요."
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <Label className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4" />
              여행지
            </Label>
            {isRegionsLoading ? (
              <p className="text-sm text-gray-500">
                지역 정보를 불러오는 중...
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {regions.map((region) => (
                  <Badge
                    key={region.key}
                    variant={
                      formData.location === region.value ? 'default' : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        location: region.value,
                      }))
                    }
                  >
                    {region.value}
                  </Badge>
                ))}
              </div>
            )}
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
                  maxParticipants: parseInt(e.target.value, 10) || 2,
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
              {KEYWORD_OPTIONS.map((option) => (
                <Badge
                  key={option.value}
                  variant={
                    selectedKeywords.includes(option.value)
                      ? 'default'
                      : 'outline'
                  }
                  className="cursor-pointer"
                  onClick={() => toggleKeyword(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t sticky bottom-0 bg-white z-10 space-y-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>오류 발생</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button
              type="submit"
              form="create-post-form"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? '작성 중...' : '작성 완료'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
