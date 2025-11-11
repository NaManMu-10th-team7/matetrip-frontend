import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Award, Star, Send, ChevronRight } from 'lucide-react';
import { ReviewCompleteModal } from './ReviewCompleteModal';
import { AlertDialog } from './AlertDialog';
import { API_BASE_URL } from '../api/client.ts'; // AlertDialog 컴포넌트 import

interface Member {
  id: string;
  name: string;
  avatar: string;
}

interface TripReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  membersToReview: Member[];
  workspaceId: string;
  onComplete?: () => void;
}

const ratingTexts = [
  '최악이에요 😢',
  '별로에요 😕',
  '괜찮아요 😊',
  '좋아요 😄',
  '최고에요! 🎉',
];

export function TripReviewModal({
  isOpen,
  onClose,
  membersToReview,
  workspaceId,
  onComplete,
}: TripReviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviews, setReviews] = useState<
    Array<{ rating: number; comment: string }>
  >(membersToReview.map(() => ({ rating: 0, comment: '' })));
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false); // 에러 모달 상태
  const [errorMessage, setErrorMessage] = useState(''); // 에러 메시지 상태

  // membersToReview가 변경될 때마다 reviews와 currentIndex를 리셋합니다.
  useEffect(() => {
    if (isOpen) {
      setReviews(membersToReview.map(() => ({ rating: 0, comment: '' })));
      setCurrentIndex(0);
    }
  }, [membersToReview, isOpen]);

  const currentTraveler = membersToReview[currentIndex];
  const currentReview = reviews[currentIndex];

  // currentTraveler 또는 currentReview가 아직 준비되지 않았으면 렌더링하지 않음
  if (!currentTraveler || !currentReview) {
    return null; // 또는 로딩 스피너를 보여줄 수 있습니다.
  }

  const handleRatingChange = (rating: number) => {
    const newReviews = [...reviews];
    newReviews[currentIndex] = { ...newReviews[currentIndex], rating };
    setReviews(newReviews);
  };

  const handleCommentChange = (comment: string) => {
    const newReviews = [...reviews];
    newReviews[currentIndex] = { ...newReviews[currentIndex], comment };
    setReviews(newReviews);
  };

  const handleNext = async () => {
    if (currentIndex < membersToReview.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 모든 리뷰 제출
      const reviewData = reviews.map((review, index) => ({
        revieweeId: membersToReview[index].id,
        rating: review.rating,
        content: review.comment,
      }));

      try {
        const response = await axios.post(
          `${API_BASE_URL}/workspace/${workspaceId}/reviews`,
          reviewData,
          { withCredentials: true } // 인증 쿠키를 보내기 위해 추가
        );

        console.log('Reviews submitted successfully:', response.data); // 성공 시 완료 모달 표시
        onClose(); // 리뷰 모달 닫기
        setShowCompleteModal(true); // 감사 모달 열기
      } catch (error) {
        console.error('Error submitting reviews:', error);
        if (axios.isAxiosError(error) && error.response?.status === 409) {
          // 409 Conflict 에러 처리
          setErrorMessage(
            '이미 해당 동행에 대한 리뷰를 작성했습니다. 중복 작성은 불가능합니다.'
          );
          setShowErrorModal(true);
        } else {
          // 그 외 에러 처리
          setErrorMessage(
            '리뷰 제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
          );
          setShowErrorModal(true);
        }
      }
    }
  };

  const isCurrentReviewValid =
    currentReview.rating > 0 && currentReview.comment.trim().length > 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md p-6">
          <div className="flex flex-col items-center space-y-3">
            {/* 헤더 아이콘 */}
            <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-2xl flex items-center justify-center">
              <Award className="w-8 h-8 text-white" />
            </div>

            {/* 제목 */}
            <DialogTitle className="text-gray-900 text-xl">
              여행 리뷰 작성
            </DialogTitle>

            {/* 설명 */}
            <DialogDescription className="text-gray-600 text-sm text-center">
              함께한 동행에 대한 솔직한 리뷰를 남겨주세요
            </DialogDescription>

            {/* 진행 상황 */}
            <span className="text-gray-500 text-sm">
              {currentIndex + 1} / {membersToReview.length}
            </span>

            {/* 진행 표시바 */}
            <div className="flex gap-1 w-full max-w-[200px]">
              {membersToReview.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    index <= currentIndex ? 'bg-gray-800' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* 사용자 아바타 */}
            <div className="flex flex-col items-center gap-1.5">
              <Avatar className="w-20 h-20">
                <AvatarImage src={currentTraveler?.avatar} />
                <AvatarFallback className="text-white bg-gradient-to-br from-gray-600 to-gray-800">
                  {currentTraveler?.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-gray-900">{currentTraveler?.name}</span>
            </div>

            {/* 평점 선택 */}
            <div className="flex flex-col items-center gap-2 w-full">
              <span className="text-gray-900 text-sm">평점을 선택해주세요</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRatingChange(rating)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        rating <= currentReview.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {currentReview.rating > 0 && (
                <span className="text-gray-700 text-sm">
                  {ratingTexts[currentReview.rating - 1]}
                </span>
              )}
            </div>

            {/* 리뷰 작성 */}
            <div className="w-full space-y-1.5">
              <label className="text-gray-900 text-sm">
                자세한 리뷰를 남겨주세요 (필수)
              </label>
              <Textarea
                value={currentReview.comment}
                onChange={(e) => handleCommentChange(e.target.value)}
                placeholder="함께한 여행의 소중한 추억을 나눠주세요..."
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* 다음 버튼 */}
            <Button
              onClick={handleNext}
              disabled={!isCurrentReviewValid}
              className="w-full bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-gray-950 text-white"
            >
              {currentIndex < membersToReview.length - 1 ? '다음' : '완료'}
              {currentIndex < membersToReview.length - 1 ? (
                <ChevronRight className="w-4 h-4 ml-2" />
              ) : (
                <Send className="w-4 h-4 ml-2" />
              )}
            </Button>

            {/* 안내 문구 */}
            <span className="text-gray-600 text-xs text-center">
              솔직한 리뷰는 다른 여행자들에게 큰 도움이 됩니다
            </span>
          </div>
        </DialogContent>
      </Dialog>
      <ReviewCompleteModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onConfirm={onComplete || (() => {})}
      />
      <AlertDialog
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="오류 발생"
        description={errorMessage}
        onConfirm={() => {
          setShowErrorModal(false);
          onClose(); // 확인 버튼 클릭 시 리뷰 모달도 닫기
        }}
      />
    </>
  );
}
