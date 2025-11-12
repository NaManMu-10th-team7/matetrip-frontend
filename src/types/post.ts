import { type UserProfile } from './user';

export type PostStatus = '모집중' | '모집완료' | '완료';

export interface Writer {
  id: string;
  email: string;
  profile: UserProfile;
}

interface WriterProfile {
  id: string;
  nickname: string;
  gender?: string;
  description?: string;
  intro?: string;
  mbtiTypes?: string;
  travelStyles?: string[];
  tendency?: string[];
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
  writerId: string;
  writerProfile?: WriterProfile;
  writer?: Writer;
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
