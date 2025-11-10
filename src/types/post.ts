import { type UserProfile, type User } from './user';

export type PostStatus = '모집중' | '모집완료' | '여행중' | '여행완료';

export interface Writer {
  id: string;
  email: string;
  profile: UserProfile;
}

export interface Requester {
  id: string;
  email: string;
  profile: UserProfile;
}

export interface Participation {
  id: string;
  status: '승인' | '대기중' | '거절';
  requester: Requester;
  requestedAt: string;
}

export interface Post {
  id: string;
  writer: Writer;
  createdAt: string;
  title: string;
  content: string;
  status: PostStatus;
  location: string;
  maxParticipants: number;
  keywords: string[];
  startDate: string;
  endDate: string;
  participations: Participation[];
}
