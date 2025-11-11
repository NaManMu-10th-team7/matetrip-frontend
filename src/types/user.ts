export interface UserProfile {
  id: string;
  nickname: string;
  gender: string;
  description: string;
  intro: string;
  mbtiTypes: string;
  travelStyles: string[];
  travelTendency: string[];
  profileImageId?: string;
}

export interface User {
  id: string;
  email: string;
  profile: UserProfile;
}
