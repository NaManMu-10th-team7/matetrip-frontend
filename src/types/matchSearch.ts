import type { MatchingInfo, MatchRecruitingPostDto } from './matching';

export interface MatchingResult {
  post: MatchRecruitingPostDto;
  matchingInfo: MatchingInfo;
}
