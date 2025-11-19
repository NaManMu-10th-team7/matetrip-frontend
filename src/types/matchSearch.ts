import type { MatchingInfo, MatchRecruitingPostDto } from './matching.ts';

export interface MatchingResult {
  post: MatchRecruitingPostDto;
  matchingInfo: MatchingInfo;
  writerProfileImageId?: string | null; // 추가된 필드
}

// [수정] 다른 모듈에서 import할 수 있도록 MatchRecruitingPostDto를 다시 export합니다.
export type { MatchRecruitingPostDto };
