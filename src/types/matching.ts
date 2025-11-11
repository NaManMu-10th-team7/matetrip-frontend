import type { TravelStyleType } from '../constants/travelStyle';
import type { TravelTendencyType } from '../constants/travelTendencyType';

export type KeywordType = string;

export interface MatchRecruitingPostDto {
  id: string;
  title: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
  maxParticipants: number;
  keywords: KeywordType[];
}

export interface MatchCandidateDto {
  userId: string;
  score: number;
  overlappingTravelStyles: TravelStyleType[];
  overlappingTendencies: TravelTendencyType[];
  mbtiMatchScore: number;
  recruitingPost?: MatchRecruitingPostDto | null;
}

export interface MatchResponseDto {
  matches: MatchCandidateDto[];
}
