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

// 마커 데이터의 타입을 정의합니다.
type MarkerType = {
  lat: number;
  lng: number;
  address: string;
  content: string; // 장소 이름
  category?: string;
};

export function MapPanel() {
  // 마커 정보를 저장할 상태 (주소와 내용 추가)
  const [markers, setMarkers] = useState<MarkerType[]>([]);

  const removeMarker = (targetIndex: number) => {
    setMarkers((prev) => prev.filter((_, index) => index !== targetIndex));
  };

  // EventMarkerContainer의 props 타입을 명확하게 정의합니다.
  type EventMarkerContainerProps = {
    marker: MarkerType;
    index: number;
  };

  function EventMarkerContainer({ marker, index }: EventMarkerContainerProps) {
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
          <div
            style={{
              padding: '10px',
              color: '#000',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #ccc',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              minWidth: '180px',
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
              {marker.content}
            </div>
            {marker.category && (
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                {marker.category.split(' > ').pop()}
              </div>
            )}
            <div style={{ fontSize: '13px', color: '#555' }}>
              {marker.address}
            </div>
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
            if (status !== window.kakao.maps.services.Status.OK) {
              console.error(
                'Geocoder가 주소를 가져오는 데 실패했습니다. 상태:',
                status
              );
              return;
            }

            const addressResult = result[0];
            const address =
              addressResult?.road_address?.address_name ||
              addressResult?.address?.address_name;
            // 건물 이름이 있으면 검색 정확도를 위해 건물 이름을, 없으면 주소를 검색 키워드로 사용
            const searchKeyword =
              addressResult?.road_address?.building_name || address;

            console.log('클릭한 위치의 주소:', address);
            console.log('장소 검색 키워드:', searchKeyword);

            const places = new window.kakao.maps.services.Places();
            // 키워드로 장소를 검색합니다. 검색 옵션으로 현재 좌표를 제공하여 정확도를 높입니다.
            places.keywordSearch(
              searchKeyword,
              (data, status) => {
                let placeName = searchKeyword;
                let categoryName: string | undefined = undefined;

                if (status === window.kakao.maps.services.Status.OK) {
                  // 검색 결과 중 첫 번째 장소의 정보를 사용합니다.
                  const place = data[0];
                  placeName = place.place_name;
                  categoryName = place.category_name;
                  console.log('검색된 장소:', placeName, '| 카테고리:', categoryName);
                }

                const newMarker = {
                  lat: latlng.getLat(),
                  lng: latlng.getLng(),
                  address: address,
                  content: placeName, // 마커에 표시될 내용은 장소 이름으로 설정
                  category: categoryName,
                };
                setMarkers((prev) => [...prev, newMarker]);
              },
              { location: latlng } // 현재 클릭한 좌표 주변으로 검색 범위를 좁힙니다.
            );
          });
        }}
      >
        {markers.map((marker, index) => (
          <EventMarkerContainer
            key={`EventMarkerContainer-${marker.lat}-${marker.lng}-${index}`}
            marker={marker}
            index={index}
          />
        ))}
        <MapUI />
      </Map>
    </div>
  );
}
