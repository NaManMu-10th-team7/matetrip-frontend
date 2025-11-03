import React, { useState, useRef, useCallback } from 'react';
import { Plus, Maximize2, Layers } from 'lucide-react';
import { Button } from './ui/button';
import {
  Map,
  MapMarker,
  Polyline,
  CustomOverlayMap,
} from 'react-kakao-maps-sdk';

type LayerType = 'all' | 'day1' | 'day2';

// 레이어 정보를 동적으로 관리하기 위해 확장 가능한 타입 정의
type DayLayer = {
  id: `day${number}`;
  label: string;
  color: string; // Polyline 색상을 위한 속성 추가
};

// 마커 데이터의 타입을 정의합니다.
type MarkerType = {
  lat: number;
  lng: number;
  address: string;
  content: string; // 장소 이름
  category?: string;
  // 마커를 고유하게 식별하고, 어떤 레이어에 속하는지 알기 위한 속성 추가
  id: number;
  layerId: DayLayer['id'];
};

export function MapPanel() {
  // 레이어 정보를 상수가 아닌 상태로 관리하여 동적 확장성을 확보
  const [dayLayers, setDayLayers] = useState<DayLayer[]>([
    { id: 'day1', label: 'Day 1', color: '#FF0000' }, // 빨간색
    { id: 'day2', label: 'Day 2', color: '#0000FF' }, // 파란색
  ]);

  // '전체' 레이어를 포함한 전체 UI용 레이어 목록
  const UILayers: { id: LayerType | DayLayer['id']; label: string }[] = [
    { id: 'all', label: '전체' },
    ...dayLayers,
  ];

  // 레이어별로 마커를 저장하도록 상태 구조 변경
  const [markersByLayer, setMarkersByLayer] = useState<
    Record<DayLayer['id'], MarkerType[]>
  >(() => dayLayers.reduce((acc, layer) => ({ ...acc, [layer.id]: [] }), {}));
  const [selectedLayer, setSelectedLayer] = useState<LayerType>('all');
  // 최종 여행 계획(일정)을 저장할 상태
  const [itinerary, setItinerary] = useState<
    Record<DayLayer['id'], MarkerType[]>
  >(() => dayLayers.reduce((acc, layer) => ({ ...acc, [layer.id]: [] }), {}));

  const removeMarker = (markerToRemove: MarkerType) => {
    setMarkersByLayer((prev) => ({
      ...prev,
      [markerToRemove.layerId]: prev[markerToRemove.layerId].filter(
        (marker) => marker.id !== markerToRemove.id
      ),
    }));
  };

  // 여행 일정에 장소를 추가하는 함수
  const addToItinerary = (markerToAdd: MarkerType) => {
    // 모든 Day를 통틀어 이미 추가된 장소인지 확인
    const isAlreadyAdded = Object.values(itinerary)
      .flat()
      .some((item) => item.id === markerToAdd.id);

    if (isAlreadyAdded) {
      alert('이미 일정에 추가된 장소입니다.');
      return;
    }

    const targetDay = markerToAdd.layerId;
    setItinerary((prev) => {
      const newItineraryForDay = [...prev[targetDay], markerToAdd];
      const updatedItinerary = { ...prev, [targetDay]: newItineraryForDay };

      // 콘솔에서 현재까지 추가된 여행 계획을 확인할 수 있습니다.
      console.log(
        `Day ${targetDay.slice(-1)} 여행 계획에 추가됨:`,
        markerToAdd
      );
      console.log('현재 전체 여행 계획:', updatedItinerary);
      return updatedItinerary;
    });
  };

  // EventMarkerContainer의 props 타입을 명확하게 정의합니다.
  type EventMarkerContainerProps = {
    marker: MarkerType;
    index: number;
    // itinerary에 마커가 포함되어 있는지 여부를 전달받음
    isAdded: boolean;
  };

  function EventMarkerContainer({
    marker,
    index,
    isAdded,
  }: EventMarkerContainerProps) {
    const [isVisible, setIsVisible] = useState(false);
    const timerRef = useRef<number | null>(null);

    const handleMouseOver = useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsVisible(true);
    }, []);

    const handleMouseOut = useCallback(() => {
      timerRef.current = window.setTimeout(() => {
        setIsVisible(false);
      }, 100);
    }, []);

    return (
      <MapMarker
        key={`marker-${marker.id}`}
        position={{ lat: marker.lat, lng: marker.lng }}
        onClick={() => removeMarker(marker)}
        // MapMarker에 직접 onMouseOver와 onMouseOut 이벤트를 다시 적용합니다.
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        // isVisible 상태일 때만 자식(CustomOverlay)을 렌더링합니다.
      >
        {/* isVisible이 true일 때만 정보창을 표시합니다. */}
        {/* yAnchor를 사용해 정보창을 마커 아이콘 위로 올립니다. */}
        {isVisible && (
          <div
            className="bg-white rounded-lg border border-gray-300 shadow-md min-w-[200px] text-black overflow-hidden"
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
          >
            <div className="p-3">
              <div className="font-bold text-sm mb-1">{marker.content}</div>
              {marker.category && (
                <div className="text-xs text-gray-500 mb-1.5">
                  {marker.category.split(' > ').pop()}
                </div>
              )}
              <div className="text-xs text-gray-600 mb-3">{marker.address}</div>
              <Button
                size="xs"
                className={`w-full h-7 text-xs ${
                  isAdded
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                onClick={(e) => {
                  e.stopPropagation(); // 마커의 onClick 이벤트 전파 방지
                  if (!isAdded) addToItinerary(marker);
                }}
                disabled={isAdded}
              >
                {isAdded ? '추가됨' : '일정에 추가'}
              </Button>
            </div>
          </div>
        )}
      </MapMarker>
    );
  }

  // MapUI 컴포넌트가 selectedLayer 상태와 상태 변경 함수를 props로 받도록 수정
  function MapUI({
    selectedLayer,
    setSelectedLayer,
  }: {
    selectedLayer: LayerType;
    setSelectedLayer: React.Dispatch<React.SetStateAction<LayerType>>;
  }) {
    return (
      <>
        {/* Layer Controls */}
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 space-y-2 w-32">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-gray-600" />
            <span className="text-sm">레이어</span>
          </div>
          {UILayers.map((layer) => (
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

  // 선택된 레이어에 따라 표시할 마커들을 결정
  const markersToDisplay =
    selectedLayer === 'all'
      ? Object.values(markersByLayer).flat()
      : markersByLayer[selectedLayer] || [];

  // itinerary 데이터를 기반으로 Polyline 경로를 동적으로 생성
  const polylinePaths = dayLayers.reduce(
    (acc, layer) => {
      const path =
        itinerary[layer.id]?.map((m) => ({ lat: m.lat, lng: m.lng })) || [];
      return { ...acc, [layer.id]: path };
    },
    {} as Record<DayLayer['id'], { lat: number; lng: number }[]>
  );

  return (
    <div className="h-full relative">
      <Map
        id="map"
        className="w-full h-full"
        center={{
          lat: 33.450701,
          lng: 126.570667,
        }}
        level={1}
        onClick={(_t, mouseEvent) => {
          // '전체' 레이어에서는 마커 추가를 방지
          if (selectedLayer === 'all') {
            return;
          }

          // Geocoder 라이브러리 로드 확인
          if (
            !window.kakao ||
            !window.kakao.maps ||
            !window.kakao.maps.services
          ) {
            alert('Kakao Maps services 라이브러리가 로드되지 않았습니다.');
            return;
          }

          const latlng = mouseEvent.latLng;
          const geocoder = new window.kakao.maps.services.Geocoder();

          // 좌표를 주소로 변환
          geocoder.coord2Address(
            latlng.getLng(),
            latlng.getLat(),
            (result, status) => {
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
                    console.log(
                      '검색된 장소:',
                      placeName,
                      '| 카테고리:',
                      categoryName
                    );
                  }

                  const newMarker = {
                    id: Date.now(), // 고유 ID로 현재 시간 사용
                    layerId: selectedLayer, // 현재 선택된 레이어 ID 저장
                    lat: latlng.getLat(),
                    lng: latlng.getLng(),
                    address: address,
                    content: placeName, // 마커에 표시될 내용은 장소 이름으로 설정
                    category: categoryName,
                  };
                  // 현재 선택된 레이어의 배열에 새로운 마커 추가
                  setMarkersByLayer((prev) => ({
                    ...prev,
                    [selectedLayer]: [...prev[selectedLayer], newMarker],
                  }));
                },
                {
                  location: latlng, // 현재 클릭한 좌표를 중심으로
                  radius: 50, // 50미터 반경 내에서 검색합니다.
                  sort: window.kakao.maps.services.SortBy.DISTANCE, // 거리순으로 정렬합니다.
                }
              );
            }
          );
        }}
      >
        {markersToDisplay.map((marker, index) => (
          <EventMarkerContainer
            key={`EventMarkerContainer-${marker.id}`}
            marker={marker}
            index={index}
            // 현재 마커가 itinerary에 포함되어 있는지 여부를 prop으로 전달
            isAdded={Object.values(itinerary)
              .flat()
              .some((item) => item.id === marker.id)}
          />
        ))}

        {/* 여행 계획(itinerary)에 포함된 마커에 순서 번호 표시 */}
        {Object.entries(itinerary).map(([layerId, dayItinerary]) => {
          const shouldDisplay =
            selectedLayer === 'all' || selectedLayer === layerId;
          return (
            shouldDisplay &&
            dayItinerary.map((marker, index) => (
              <CustomOverlayMap
                key={`order-overlay-${marker.id}`}
                position={{ lat: marker.lat, lng: marker.lng }}
                yAnchor={2.5} // 마커 아이콘 위로 오버레이를 올립니다.
                zIndex={1} // 마커보다 위에 표시되도록 z-index 설정
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '1.25rem', // w-5
                    height: '1.25rem', // h-5
                    backgroundColor: 'black',
                    color: 'white',
                    fontSize: '0.75rem', // text-xs
                    borderRadius: '9999px', // rounded-full
                    boxShadow:
                      '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // shadow-md
                  }}
                >
                  {index + 1}
                </div>
              </CustomOverlayMap>
            ))
          );
        })}

        {/* 모든 Day 레이어를 순회하며 Polyline을 동적으로 렌더링 */}
        {dayLayers.map((layer) => {
          const shouldDisplay =
            selectedLayer === 'all' || selectedLayer === layer.id;
          const dayPath = polylinePaths[layer.id];
          return (
            shouldDisplay &&
            dayPath.length > 1 &&
            // 경로를 구간별로 나누어 각각의 Polyline으로 렌더링합니다.
            dayPath.map((_, index) => {
              if (index === 0) return null; // 첫 번째 점에서는 시작만 하므로 선을 그리지 않습니다.
              const segmentPath = [dayPath[index - 1], dayPath[index]];
              return (
                <Polyline
                  key={`polyline-${layer.id}-${index}`}
                  path={segmentPath}
                  strokeWeight={3}
                  strokeColor={layer.color}
                  strokeOpacity={0.8}
                  strokeStyle={'solid'}
                  endArrow={true} // 선의 끝에 화살표를 추가합니다.
                />
              );
            })
          );
        })}

        <MapUI
          selectedLayer={selectedLayer}
          setSelectedLayer={setSelectedLayer}
        />
      </Map>
    </div>
  );
}
