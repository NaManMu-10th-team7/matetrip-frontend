import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BrainCircuit, Globe } from 'lucide-react';

interface AIRecommendationLoadingModalProps {
  isOpen: boolean;
}

const loadingMessages = [
  '사용자의 여행 스타일 분석 중...',
  '최신 여행 트렌드를 확인하는 중...',
  '숨겨진 명소를 탐색하는 중...',
  '최적의 동행 코스를 설계하는 중...',
  '잊지 못할 추억을 준비하는 중...',
];

export function AIRecommendationLoadingModal({
  isOpen,
}: AIRecommendationLoadingModalProps) {
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
              <Globe className="w-20 h-20 text-blue-500 animate-spin-slow" />
              <BrainCircuit className="absolute w-12 h-12 text-sky-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-800">
                AI가 최적의 여행지를 찾고 있어요!
              </h2>
              <p className="text-gray-500">
                잠시만 기다려주시면 멋진 여행 계획을 추천해 드릴게요.
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
                  className="text-sm font-medium text-blue-600"
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