import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Download } from 'lucide-react'; // 아이콘 변경

interface PdfGeneratingLoadingModalProps {
  isOpen: boolean;
}

const loadingMessages = [
  '여행 계획을 PDF 문서로 변환 중...',
  '지도 이미지와 경로 정보를 통합하는 중...',
  '최종 문서 레이아웃을 구성하는 중...',
  'PDF 파일 생성이 거의 완료되었습니다...',
  '잠시만 기다려주세요!',
];

export function PdfGeneratingLoadingModal({
  isOpen,
}: PdfGeneratingLoadingModalProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const intervalId = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 2500);

    return () => clearInterval(intervalId);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-white rounded-2xl shadow-2xl p-8 sm:p-12 flex flex-col items-center gap-6 max-w-sm w-full mx-4 text-center"
          >
            <div className="relative flex items-center justify-center w-24 h-24">
              <FileText className="w-20 h-20 text-primary animate-spin-slow" />
              <Download className="absolute w-12 h-12 text-primary/70 animate-pulse" />
            </div>

            <div className=""> {/* space-y-2 제거 */}
              <h2 className="text-xl font-bold text-gray-800 mb-4"> {/* mb-4 추가 */}
                PDF 문서를 생성하고 있어요!
              </h2>
              <p className="text-gray-500 mb-0"> {/* mb-0 추가 */}
                잠시만 기다려주시면
              </p>
              <p className="text-gray-500">
                여행 계획 PDF를 다운로드할 수 있어요.
              </p>
            </div>

            <div className="w-full h-12 flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentMessageIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="text-sm font-medium text-primary"
                >
                  {loadingMessages[currentMessageIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
