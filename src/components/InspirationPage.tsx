import { Sparkles, Construction } from 'lucide-react';

export function InspirationPage() {
  return (
    <div className="bg-white min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-6">
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full">
          <Sparkles className="w-10 h-10 text-purple-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Inspiration
        </h1>
        
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-full">
          <Construction className="w-5 h-5 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">준비중</span>
        </div>
        
        <p className="text-gray-600 mb-4 leading-relaxed">
          여행 영감을 주는 콘텐츠를 준비하고 있습니다.
        </p>
        
        <p className="text-sm text-gray-500">
          곧 멋진 여행 아이디어와 추천 목적지를 만나보실 수 있습니다!
        </p>
        
        {/* 추후 확장을 위한 구조 */}
        <div className="mt-12 grid grid-cols-3 gap-4 opacity-50">
          <div className="aspect-square bg-gray-200 rounded-lg"></div>
          <div className="aspect-square bg-gray-200 rounded-lg"></div>
          <div className="aspect-square bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}

