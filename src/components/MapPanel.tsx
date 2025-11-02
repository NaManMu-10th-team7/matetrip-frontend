import { useState } from 'react';
import { Plus, Maximize2, Layers } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Map } from 'react-kakao-maps-sdk';

export function MapPanel() {
  const [selectedLayer, setSelectedLayer] = useState<'all' | 'day1' | 'day2'>(
    'all'
  );

  return (
    <div className="h-full relative">
      {/* Map placeholder */}
      <div className="h-full bg-gray-200 flex items-center justify-center">
        <div className="text-center w-full h-full">
          <Map // 지도를 표시할 Container
            id="map"
            className="h-full"
            center={{
              // 지도의 중심좌표
              lat: 33.450701,
              lng: 126.570667,
            }}
            level={3} // 지도의 확대 레벨
          />
          {/* <div className="text-gray-400 mb-2">🗺️</div> */}
          {/* <p className="text-gray-600">지도 영역</p> */}
          {/* <p className="text-sm text-gray-500">실제로는 Kakao Map API 연동</p> */}
        </div>
      </div>

      {/* Layer Controls */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-gray-600" />
          <span className="text-sm">레이어</span>
        </div>
        <button
          onClick={() => setSelectedLayer('all')}
          className={`w-full px-3 py-2 rounded text-sm transition-colors ${
            selectedLayer === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setSelectedLayer('day1')}
          className={`w-full px-3 py-2 rounded text-sm transition-colors ${
            selectedLayer === 'day1'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Day 1
        </button>
        <button
          onClick={() => setSelectedLayer('day2')}
          className={`w-full px-3 py-2 rounded text-sm transition-colors ${
            selectedLayer === 'day2'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Day 2
        </button>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          여행지 추가
        </Button>
        <Button size="sm" variant="outline" className="gap-2 bg-white">
          <Maximize2 className="w-4 h-4" />
          전체 화면
        </Button>
      </div>
    </div>
  );
}
