import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowLeft, Search as SearchIcon } from 'lucide-react';
import { Button } from './ui/button';
import { MatchingCard } from './MatchingCard';
import type { MatchingResult } from '../types/matchSearch';
import type { KeywordValue } from '../utils/keyword';

interface MatchSearchState {
  results?: MatchingResult[];
  query?: {
    location?: string;
    startDate?: string;
    endDate?: string;
    keyword?: KeywordValue[];
  };
}

export function MatchSearchResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as MatchSearchState | null) || {};
  const results = state.results ?? [];
  const query = state.query ?? {};

  useEffect(() => {
    if (!state.results) {
      navigate('/', { replace: true });
    }
  }, [state.results, navigate]);

  const keywordParts: string[] = [];
  if (query.location) {
    keywordParts.push(query.location);
  }
  if (query.startDate) {
    keywordParts.push(query.startDate);
  }
  if (query.endDate) {
    keywordParts.push(query.endDate);
  }
  if (query.keyword && query.keyword.length > 0) {
    keywordParts.push(...query.keyword); //  배열을 펼쳐서 추가
  }
  const keywordsText = keywordParts.join(', ');

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4 gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" />
          뒤로 가기
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-gray-900 mb-2">맞춤 동행 검색 결과</h1>
            {keywordsText && (
              <p className="text-gray-600">
                "{keywordsText}" 검색 결과 {results.length}개
              </p>
            )}
          </div>
        </div>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {' '}
          {/* 그리드 클래스 수정 */}
          {results.map((result, index) => (
            <MatchingCard
              key={result.post.id}
              post={result.post}
              matchingInfo={result.matchingInfo}
              rank={index + 1}
              writerProfileImageId={result.writerProfileImageId}
              writerNickname={result.writerNickname ?? null}
              onClick={() =>
                navigate(`/posts/${result.post.id}`, {
                  state: { background: location },
                })
              }
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <SearchIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-gray-900 mb-2">표시할 추천 결과가 없습니다</h3>
          <p className="text-gray-600 mb-6">
            검색 조건을 다시 입력하거나 다른 키워드로 시도해보세요.
          </p>
          <Button onClick={() => navigate('/')}>홈으로 돌아가기</Button>
        </div>
      )}
    </div>
  );
}
