import React, { useState } from 'react';
import { Plus, Maximize2, Layers } from 'lucide-react';
import { Button } from './ui/button';
import { Map, MapMarker } from 'react-kakao-maps-sdk';

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
  // 마커 정보를 저장할 상태 (주소와 내용 추가)
  const [markers, setMarkers] = useState<
    { lat: number; lng: number; address: string; content: string }[]
  >([]);

  const removeMarker = (targetIndex: number) => {
    setMarkers((prev) => prev.filter((_, index) => index !== targetIndex));
  };

  // EventMarkerContainer의 props 타입을 명확하게 정의합니다.
  type EventMarkerContainerProps = {
    marker: { lat: number; lng: number };
    content: string;
    index: number;
  };

  function EventMarkerContainer({
    marker,
    content,
    index,
  }: EventMarkerContainerProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <MapMarker
        key={`${marker.lat}-${marker.lng}-${index}`}
        position={marker}
        onClick={() => removeMarker(index)}
        // MapMarker에 직접 onMouseOver와 onMouseOut 이벤트를 다시 적용합니다.
        onMouseOver={() => setIsVisible(true)}
        onMouseOut={() => setIsVisible(false)}
        // isVisible 상태일 때만 자식(CustomOverlay)을 렌더링합니다.
      >
        {/* isVisible이 true일 때만 정보창을 표시합니다. */}
        {/* yAnchor를 사용해 정보창을 마커 아이콘 위로 올립니다. */}
        {isVisible && (
          <div style={{ padding: '5px', color: '#000', background: 'white', borderRadius: '4px', border: '1px solid #ccc', whiteSpace: 'nowrap' }}>
            {content}
          </div>
        )}
      </MapMarker>
    );
  }

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
        onClick={(_t, mouseEvent) => {
          // Geocoder 라이브러리 로드 확인
          if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
            alert('Kakao Maps services 라이브러리가 로드되지 않았습니다.');
            return;
          }

          const latlng = mouseEvent.latLng;
          const geocoder = new window.kakao.maps.services.Geocoder();

          // 좌표를 주소로 변환
          geocoder.coord2Address(latlng.getLng(), latlng.getLat(), (result, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
              const address = result[0]?.road_address?.address_name || result[0]?.address?.address_name;
              console.log('클릭한 위치의 주소:', address);

              const newMarker = {
                lat: latlng.getLat(),
                lng: latlng.getLng(),
                address: address,
                content: address, // 우선 주소를 content로 사용
              };
              setMarkers((prev) => [...prev, newMarker]);
            } else {
              console.error(
                'Geocoder가 주소를 가져오는 데 실패했습니다. 상태:',
                status
              );
            }
          });
        }}
      >
        {markers.map((marker, index) => (
          <EventMarkerContainer
            key={`EventMarkerContainer-${marker.lat}-${marker.lng}-${index}`}
            marker={marker}
            index={index}
            content={marker.content}
          />
        ))}
        <MapUI />
      </Map>
    </div>
  );
}
