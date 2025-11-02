import React, { useState } from 'react';
import { Plus, Maximize2, Layers } from 'lucide-react';
import { Button } from './ui/button';
import { Map } from 'react-kakao-maps-sdk';

type LayerType = 'all' | 'day1' | 'day2';

const LAYERS: { id: LayerType; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'day1', label: 'Day 1' },
  { id: 'day2', label: 'Day 2' },
];

function MapUI() {
  const [selectedLayer, setSelectedLayer] = useState<LayerType>('all');
  return (
    <>
      {/* Layer Controls */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 space-y-2 w-32">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-gray-600" />
          <span className="text-sm">레이어</span>
        </div>
        {LAYERS.map((layer) => (
          <button
            key={layer.id}
            onClick={() => setSelectedLayer(layer.id)}
            className={`w-full px-3 py-2 rounded text-sm transition-colors ${
              selectedLayer === layer.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {layer.label}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          여행지 추가
        </Button>
        <Button size="sm" variant="outline" className="gap-2 bg-white">
          <Maximize2 className="w-4 h-4" />
          전체 화면
        </Button>
      </div>
    </>
  );
}

export function MapPanel() {
  return (
    <div className="h-full relative">
      <Map
        id="map"
        className="w-full h-full"
        center={{
          lat: 33.450701,
          lng: 126.570667,
        }}
        level={3}
      >
        <MapUI />
      </Map>
    </div>
  );
}
