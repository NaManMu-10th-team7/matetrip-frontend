import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Calendar, User, Clock, X } from 'lucide-react';
import { Input } from './ui/input';

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

// 각 제안 항목의 데이터 타입을 정의합니다.
interface SuggestionPlace {
  id: string;
  name: string;
  type: string;
}

interface SuggestionTrip {
  id: string;
  title: string;
  members?: string;
  author?: string;
}

interface SuggestionUser {
  id: string;
  name: string;
  nickname: string;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches] = useState(['경주', '김민준', '제주도']);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // 모든 제안 항목을 포함하는 discriminated union 타입을 정의합니다.
  type SearchItem =
    | { type: 'recent'; data: string; index: number }
    | { type: 'place'; data: SuggestionPlace; index: number }
    | { type: 'trip'; data: SuggestionTrip; index: number }
    | { type: 'user'; data: SuggestionUser; index: number };

  // 검색 제안 데이터
  const suggestions = {
    places: [
      { id: '1', name: '부산 (도시)', type: 'city' },
      { id: '2', name: '부산역 (주요 지점)', type: 'station' },
      { id: '3', name: '부산 돼지국밥 (키워드 추천)', type: 'keyword' },
    ],
    trips: [
      { id: '1', title: '[동행] 부산 2박 3일 힐링/맛집', members: '3/4명' },
      {
        id: '2',
        title: '[일정] 완벽한 부산 1박 2일 코스',
        author: 'by. 이수호',
      },
    ],
    users: [{ id: '1', name: '부산사는 최유나', nickname: '닉네임' }],
  };

  // 현재 표시되는 모든 항목들
  const getAllItems = (): SearchItem[] => {
    if (!query) {
      return recentSearches.map((search, idx) => ({
        type: 'recent',
        data: search,
        index: idx,
      }));
    }

    const items: SearchItem[] = [];
    suggestions.places.forEach((place) => {
      items.push({ type: 'place', data: place, index: items.length });
    });
    suggestions.trips.forEach((trip) => {
      items.push({ type: 'trip', data: trip, index: items.length });
    });
    suggestions.users.forEach((user) => {
      items.push({ type: 'user', data: user, index: items.length });
    });
    return items;
  };

  const allItems = getAllItems();

  // 선택된 항목으로 스크롤
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  // query나 focus 변경 시 선택 초기화
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query, isFocused]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (query.trim()) {
      onSearch?.(query);
      setIsFocused(false);
    }
  };

  const handleItemClick = (item: SearchItem) => {
    if (item.type === 'recent' || item.type === 'place') {
      setQuery(item.type === 'recent' ? item.data : item.data.name);
      inputRef.current?.focus();
    } else if (item.type === 'trip') {
      // trip의 제목을 검색어로 설정 후 검색
      const searchQuery = item.data.title;
      setQuery(searchQuery);
      onSearch?.(searchQuery);
      setIsFocused(false);
    } else if (item.type === 'user') {
      // user의 이름을 검색어로 설정 후 검색
      const searchQuery = item.data.name;
      setQuery(searchQuery);
      onSearch?.(searchQuery);
      setIsFocused(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isFocused) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + allItems.length) % allItems.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < allItems.length) {
        handleItemClick(allItems[selectedIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      setSelectedIndex(-1);
    }
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    inputRef.current?.focus();
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex-1 max-w-2xl" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="통합 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 py-2 w-full rounded-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 드롭다운 */}
      {isFocused && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {/* 빈 상태: 최근 검색어 */}
          {!query && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3 text-gray-500">
                <Clock className="w-4 h-4" />
                <span className="text-sm">최근 검색어</span>
              </div>
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    onClick={() => handleRecentSearchClick(search)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedIndex === index
                        ? 'bg-blue-100 text-blue-900'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 입력 상태: 실시간 제안 */}
          {query && (
            <div className="p-4 space-y-4">
              {/* 장소 */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">장소</span>
                </div>
                <div className="space-y-1">
                  {suggestions.places.map((place) => {
                    const itemIndex = allItems.findIndex(
                      (item) =>
                        item.type === 'place' && item.data.id === place.id
                    );
                    return (
                      <button
                        key={place.id}
                        ref={(el) => {
                          itemRefs.current[itemIndex] = el;
                        }}
                        onClick={() => handleRecentSearchClick(place.name)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedIndex === itemIndex
                            ? 'bg-blue-100 text-blue-900'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {place.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 여행 일정/동행 */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">여행 일정/동행</span>
                </div>
                <div className="space-y-1">
                  {suggestions.trips.map((trip) => {
                    const itemIndex = allItems.findIndex(
                      (item) => item.type === 'trip' && item.data.id === trip.id
                    );
                    return (
                      <button
                        key={trip.id}
                        ref={(el) => {
                          itemRefs.current[itemIndex] = el;
                        }}
                        onClick={() => handleItemClick(allItems[itemIndex])}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedIndex === itemIndex
                            ? 'bg-blue-100 text-blue-900'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div>{trip.title}</div>
                        <div className="text-sm text-gray-500">
                          {trip.members || trip.author}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 사용자 */}
              <div>
                <div className="flex items-center gap-2 mb-2 text-gray-500">
                  <User className="w-4 h-4" />
                  <span className="text-sm">사용자</span>
                </div>
                <div className="space-y-1">
                  {suggestions.users.map((user) => {
                    const itemIndex = allItems.findIndex(
                      (item) => item.type === 'user' && item.data.id === user.id
                    );
                    return (
                      <button
                        key={user.id}
                        ref={(el) => {
                          itemRefs.current[itemIndex] = el;
                        }}
                        onClick={() => handleItemClick(allItems[itemIndex])}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedIndex === itemIndex
                            ? 'bg-blue-100 text-blue-900'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div>{user.name}</div>
                        <div className="text-sm text-gray-500">
                          {user.nickname}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
