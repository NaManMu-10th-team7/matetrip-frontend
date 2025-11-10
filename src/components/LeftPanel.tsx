import { useState, useEffect, useRef, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Calendar,
  Search,
  StickyNote,
  ListOrdered,
} from 'lucide-react';
import type { Poi } from '../hooks/usePoiSocket';
import type { DayLayer, KakaoPlace } from './MapPanel';
import { Input } from './ui/input';
import { Button } from './ui/button';

const KAKAO_MAP_SERVICES_STATUS = window.kakao?.maps.services.Status;
type KakaoPagination = kakao.maps.Pagination;

interface PageInfo {
  current: number;
  last: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

function ItineraryPanel({
  itinerary,
  dayLayers,
  onPoiClick,
}: {
  itinerary: Record<string, Poi[]>;
  dayLayers: DayLayer[];
  onPoiClick: (poi: Poi) => void;
}) {
  return (
    <div className="p-3 space-y-2 h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-2">
        <ListOrdered className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-semibold">여행 일정</span>
      </div>
      <div className="space-y-3">
        {dayLayers.map((layer) => (
          <div key={layer.id}>
            <h3
              className="text-sm font-bold mb-2 pb-1 border-b"
              style={{ borderBottomColor: layer.color }}
            >
              {layer.label}
            </h3>
            <ul className="space-y-2">
              {itinerary[layer.id] && itinerary[layer.id].length > 0 ? (
                itinerary[layer.id].map((poi, index) => (
                  <li
                    key={poi.id}
                    className="flex items-center gap-2 text-xs p-1 rounded-md cursor-pointer hover:bg-gray-100"
                    onClick={() => onPoiClick(poi)}
                  >
                    <span
                      className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-white text-xs"
                      style={{ backgroundColor: layer.color }}
                    >
                      {index + 1}
                    </span>
                    <span className="truncate">{poi.placeName}</span>
                  </li>
                ))
              ) : (
                <p className="text-xs text-gray-500">추가된 장소가 없습니다.</p>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchPanel({
  onPlaceClick,
}: {
  onPlaceClick: (place: KakaoPlace) => void;
}) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<KakaoPlace[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);

  const placesRef = useRef<kakao.maps.services.Places | null>(null);
  const paginationRef = useRef<KakaoPagination | null>(null);

  useEffect(() => {
    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
      placesRef.current = new window.kakao.maps.services.Places();
    }
  }, []);

  const searchCallback = useCallback(
    (
      data: KakaoPlace[],
      status: kakao.maps.services.Status,
      pagi: KakaoPagination
    ) => {
      if (status === KAKAO_MAP_SERVICES_STATUS.OK) {
        setResults(data);
        paginationRef.current = pagi;
        setPageInfo({
          current: pagi.current,
          last: pagi.last,
          hasPrevPage: pagi.hasPrevPage,
          hasNextPage: pagi.hasNextPage,
        });
      } else {
        setResults([]);
        setPageInfo(null);
        if (status === KAKAO_MAP_SERVICES_STATUS.ZERO_RESULT) {
          // UI에 메시지를 표시하므로 alert는 제거
        } else {
          alert('검색 중 오류가 발생했습니다.');
        }
      }
    },
    []
  );

  const handleSearch = useCallback(() => {
    if (!keyword.trim()) {
      alert('검색어를 입력해주세요.');
      return;
    }
    if (!placesRef.current) {
      alert('카카오 지도 서비스가 아직 로드되지 않았습니다.');
      return;
    }
    placesRef.current.keywordSearch(keyword, searchCallback, { page: 1 });
  }, [keyword, searchCallback]);

  return (
    <div className="p-4 h-full flex flex-col gap-4">
      {/* 1. 검색 바 */}
      <div className="flex-shrink-0 flex gap-2">
        <Input
          type="text"
          placeholder="장소, 주소 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="h-9"
        />
        <Button size="sm" onClick={handleSearch} className="h-9">
          검색
        </Button>
      </div>

      {/* 2. 결과 및 페이징 컨테이너 */}
      <div className="flex-1 flex flex-col min-h-0 border-t pt-4">
        {/* 2a. 스크롤 가능한 결과 목록 */}
        <ul className="flex-1 overflow-y-auto space-y-2 pr-2">
          {results.length > 0 ? (
            results.map((place) => (
              <li
                key={place.id}
                className="p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                onClick={() => onPlaceClick(place)}
              >
                <div className="text-sm font-semibold truncate">
                  {place.place_name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {place.road_address_name || place.address_name}
                </div>
              </li>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              검색어를 입력해주세요.
            </div>
          )}
        </ul>

        {/* 2b. 페이징 컨트롤 */}
        {pageInfo && results.length > 0 && (
          <div className="flex-shrink-0 flex justify-center items-center gap-3 pt-2 mt-2 border-t">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => paginationRef.current?.gotoPage(pageInfo.current - 1)}
              disabled={!pageInfo.hasPrevPage}
              className="h-7 px-2"
            >
              이전
            </Button>
            <span className="text-xs">
              {pageInfo.current} / {pageInfo.last}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => paginationRef.current?.gotoPage(pageInfo.current + 1)}
              disabled={!pageInfo.hasNextPage}
              className="h-7 px-2"
            >
              다음
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface LeftPanelProps {
  isOpen: boolean;
  itinerary: Record<string, Poi[]>;
  dayLayers: DayLayer[];
  unmarkPoi: (poiId: number) => void;
  onPlaceClick: (place: KakaoPlace) => void;
  onPoiClick: (poi: Poi) => void;
}

export function LeftPanel({
  isOpen,
  itinerary,
  dayLayers,
  unmarkPoi,
  onPlaceClick,
  onPoiClick,
}: LeftPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out">
      <Tabs defaultValue="plan" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-around rounded-none bg-gray-50 border-b">
          <TabsTrigger value="plan" className="flex-1 gap-2">
            <Calendar className="w-4 h-4" />
            <span>일정</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex-1 gap-2">
            <Search className="w-4 h-4" />
            <span>장소 검색</span>
          </TabsTrigger>
          <TabsTrigger value="memo" className="flex-1 gap-2">
            <StickyNote className="w-4 h-4" />
            <span>메모</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="plan" className="flex-1 overflow-auto m-0">
          <ItineraryPanel
            itinerary={itinerary}
            dayLayers={dayLayers}
            onPoiClick={onPoiClick}
          />
        </TabsContent>
        {/* 검색 탭: position-based layout으로 변경 */}
        <TabsContent value="search" className="flex-1 relative m-0">
          <div className="absolute inset-0">
            <SearchPanel onPlaceClick={onPlaceClick} />
          </div>
        </TabsContent>
        <TabsContent value="memo" className="h-full m-0 p-4">
          <div className="h-full flex items-center justify-center text-gray-500">
            메모 기능 (개발 예정)
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
