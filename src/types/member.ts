import type { UserProfile } from './user';

/**
 * 워크스페이스 멤버 정보를 나타내는 타입입니다.
 * UserProfile을 확장하여 워크스페이스 관련 정보를 포함할 수 있습니다.
 */
export interface WorkspaceMember {
  id: string;
  email: string;
  profile: UserProfile;
}