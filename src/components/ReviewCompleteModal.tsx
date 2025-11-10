import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { PartyPopper, Heart } from 'lucide-react';

interface ReviewCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ReviewCompleteModal({ isOpen, onClose, onConfirm }: ReviewCompleteModalProps) {
  const handleConfirm = () => {
    onClose();
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-8">
        <div className="flex flex-col items-center space-y-4 text-center">
          {/* 아이콘 */}
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
              <PartyPopper className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
          </div>

          {/* 제목 */}
          <DialogTitle className="text-gray-900 text-2xl">
            소중한 리뷰 감사합니다! 🎉
          </DialogTitle>

          {/* 설명 */}
          <DialogDescription className="text-gray-600 space-y-2">
            <p>
              여행 다녀오시느라 고생 많으셨어요.
            </p>
            <p>
              작성해주신 리뷰는 다른 여행자들에게<br />
              큰 도움이 될 거예요 ✨
            </p>
          </DialogDescription>

          {/* 확인 버튼 */}
          <Button
            onClick={handleConfirm}
            className="w-full mt-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
          >
            확인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
