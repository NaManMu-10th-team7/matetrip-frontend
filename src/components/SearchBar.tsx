import { useState, useRef, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Loader2,
  X,
  XCircle,
  Info,
} from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { MatchingCard } from './MatchingCard';
import client from '../api/client';
import type { Post } from '../types/post';
import type { MatchCandidateDto, MatchingInfo } from '../types/matching';
import { KEYWORD_TYPES, type KeywordKey } from '../utils/keyword';

// interface SearchBarProps {
//   onSearch?: (query: string) => void;
// }

interface MatchingResult {
  post: Post;
  matchingInfo: MatchingInfo;
}

const KEYWORD_ENTRIES = Object.entries(KEYWORD_TYPES).map(([key, label]) => ({
  key: key as KeywordKey,
  label,
}));

// 헤더에서 사용하는 통합 검색바. 입력한 조건으로 매칭 API를 직접 호출하고 결과를 즉시 MatchingCard로 보여준다.
export function SearchBar() {
  const [locationQuery, setLocationQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordKey | ''>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MatchingResult[]>([]);
  const [candidatesWithoutPost, setCandidatesWithoutPost] = useState<
    MatchCandidateDto[]
  >([]);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 검색창 바깥을 클릭하면 필터/결과 패널을 닫는다.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasFilters = Boolean(startDate || endDate || selectedKeyword);

  const buildMatchingInfo = (candidate: MatchCandidateDto): MatchingInfo => ({
    score: Math.round(candidate.score ?? 0),
    vectorscore:
      candidate.vectorScore !== undefined
        ? Math.round(candidate.vectorScore)
        : undefined,
    tendency: candidate.overlappingTendencies?.join(', '),
    style: candidate.overlappingTravelStyles?.join(', '),
  });

  const convertCandidateToResult = (
    candidate: MatchCandidateDto,
    post?: Post
  ): MatchingResult | null => {
    if (!post) {
      return null;
    }

    return {
      post,
      matchingInfo: buildMatchingInfo(candidate),
    };
  };
  // userId 받은거 post 정보 빼오기  => fallbackPostMap 에 저장
  const fetchRecruitingPostsByUserIds = async (
    userIds: string[]
  ): Promise<Map<string, Post>> => {
    const uniqueIds = Array.from(
      new Set(userIds.filter((id): id is string => Boolean(id)))
    );
    if (!uniqueIds.length) {
      return new Map();
    }

    const entries = await Promise.all(
      uniqueIds.map(async (userId) => {
        try {
          const response = await client.get<Post[]>(`/posts/user/${userId}`);
          const posts = response.data ?? [];
          const recruitingPost =
            posts.find((post) => post.status === '모집중') ?? posts[0];
          return [userId, recruitingPost ?? null] as const;
        } catch (err) {
          console.error('모집 글 조회 실패:', userId, err);
          return [userId, null] as const;
        }
      })
    );

    return entries.reduce((map, [userId, post]) => {
      if (post) {
        map.set(userId, post);
      }
      return map;
    }, new Map<string, Post>());
  };

  // 현재 입력된 조건을 기반으로 매칭 추천 API를 호출한다.
  const executeMatchingSearch = async () => {
    const params: Record<string, unknown> = {};

    if (locationQuery.trim()) {
      params.locationQuery = locationQuery.trim();
    }
    if (startDate) {
      params.startDate = startDate;
    }
    if (endDate) {
      params.endDate = endDate;
    }
    if (selectedKeyword) {
      params.keywords = [selectedKeyword];
    }

    if (!Object.keys(params).length) {
      setError('검색 조건을 입력해주세요.');
      setResults([]);
      setShowResults(true);
      return;
    }

    setIsSearching(true);
    setError(null);
    setInfoMessage(null);
    setCandidatesWithoutPost([]);
    try {
      //📌API 호출
      const response = await client.get<MatchCandidateDto[]>(
        '/profile/matching/detailsearch',
        {
          params: {
            ...params,
            limit: 10,
          },
        }
      );

      const candidates = response.data ?? [];
      const fallbackPostMap = await fetchRecruitingPostsByUserIds(
        candidates.map((candidate) => candidate.userId)
      );

      const normalized: MatchingResult[] = [];

      // 각 후보별로 userId에 매칭되는 게시글을 찾아 카드 데이터로 변환한다.
      candidates.forEach((candidate) => {
        const fallbackPost = fallbackPostMap.get(candidate.userId);
        const converted = convertCandidateToResult(candidate, fallbackPost);
        if (converted) {
          normalized.push(converted);
        }
      });

      setResults(normalized);
      console.log(results);
      setCandidatesWithoutPost([]);
      setInfoMessage(null);
    } catch (err) {
      console.error('매칭 검색 실패:', err);
      setError('맞춤 검색 결과를 불러오지 못했습니다.');
      setResults([]);
      setCandidatesWithoutPost([]);
    } finally {
      setIsSearching(false);
      setShowResults(true);
    }
  };

  // 엔터나 검색 버튼 클릭 시 실행
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    executeMatchingSearch();
  };

  const handleKeywordSelect = (keyword: KeywordKey) => {
    setSelectedKeyword((prev) => (prev === keyword ? '' : keyword));
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedKeyword('');
  };

  const handleCloseResults = () => {
    setShowResults(false);
  };

  return (
    <div className="relative flex-1 max-w-2xl" ref={containerRef}>
      {/* 검색 인풋 + 필터 토글 + 검색 버튼 */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="지역 또는 장소를 입력하세요"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            onFocus={() => setShowResults(false)}
            className="pl-10 pr-4 py-2 rounded-full"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsFilterOpen((prev) => !prev)}
          className={`gap-2 ${
            hasFilters ? 'border-blue-500 text-blue-600' : 'border-gray-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          필터
        </Button>
        <Button type="submit" className="px-5">
          검색
        </Button>
      </form>

      {/* 필터 패널 */}
      {isFilterOpen && (
        <div className="absolute right-0 mt-2 w-96 rounded-2xl border border-gray-200 bg-white shadow-xl p-5 z-50 space-y-5">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              여행 기간
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              여행 키워드
            </h4>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
              {KEYWORD_ENTRIES.map((keyword) => {
                const isSelected = selectedKeyword === keyword.key;
                return (
                  <button
                    key={keyword.key}
                    type="button"
                    onClick={() => handleKeywordSelect(keyword.key)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {keyword.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              초기화
            </button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsFilterOpen(false)}
                className="text-gray-600"
              >
                닫기
              </Button>
              <Button type="button" onClick={executeMatchingSearch}>
                적용
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* 결과 화면 나오는거  */}
      {/* 매칭 결과 패널 */}
      {showResults && (
        <div className="absolute left-0 right-0 mt-3 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 z-40">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">AI 맞춤 검색 결과</p>
              {locationQuery && (
                <p className="text-base font-semibold text-gray-900">
                  "{locationQuery}" 검색
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleCloseResults}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {isSearching ? (
            <div className="flex items-center justify-center py-10 text-gray-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              맞춤 검색 중입니다...
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-red-500">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          ) : results.length === 0 && candidatesWithoutPost.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              조건에 맞는 추천 동행을 찾지 못했습니다.
            </div>
          ) : (
            <>
              {results.length > 0 && (
                <div className="max-h-[28rem] overflow-y-auto pr-2 flex flex-col items-center gap-4">
                  {results.map((result, index) => (
                    <MatchingCard
                      key={result.post.id}
                      post={result.post}
                      matchingInfo={result.matchingInfo}
                      rank={index + 1}
                    />
                  ))}
                </div>
              )}
              {infoMessage && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 text-blue-700 px-4 py-3 text-sm">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{infoMessage}</span>
                </div>
              )}
              {candidatesWithoutPost.length > 0 && (
                <div className="mt-3 space-y-3 max-h-64 overflow-y-auto pr-1">
                  {candidatesWithoutPost.map((candidate, index) => {
                    const info = buildMatchingInfo(candidate);
                    return (
                      <div
                        key={`${candidate.userId}-${index}`}
                        className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-gray-900">
                            매칭 점수 {info.score}%
                          </p>
                          <span className="text-[10px] uppercase text-gray-400 truncate">
                            {candidate.userId}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          모집글을 아직 찾지 못해 매칭 정보만 표시됩니다.
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                          <span>여행 스타일: {info.style ?? '확인 불가'}</span>
                          <span>여행 성향: {info.tendency ?? '확인 불가'}</span>
                          <span>
                            벡터 스코어:{' '}
                            {info.vectorscore !== undefined
                              ? `${info.vectorscore}%`
                              : '확인 불가'}
                          </span>
                          <span>
                            MBTI 스코어:{' '}
                            {candidate.mbtiMatchScore !== undefined
                              ? `${Math.round(candidate.mbtiMatchScore * 100)}%`
                              : '확인 불가'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
