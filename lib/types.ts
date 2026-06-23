// FastAPI 응답 스키마에 대응하는 프론트 타입.

export interface Housewarming {
  id: string;
  name: string;
  organization: string | null;
  event_at: string; // ISO UTC
  image_url: string | null;
  dress_code: string | null;
  note: string | null;
  description: string | null;
  created_at: string;
}

export interface Participant {
  nickname: string | null;
  profile_image_url: string | null;
}

export interface Participation {
  id: string;
  user_id: string;
  housewarming_id: string;
  created_at: string;
}

export interface MyParticipation {
  housewarming_id: string | null;
}

export interface GuestbookEntry {
  id: string;
  content: string;
  created_at: string; // ISO UTC
}

export interface GuestbookListResponse {
  entries: GuestbookEntry[];
}

export interface Profile {
  id: string;
  kakao_id: string;
  nickname: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Me {
  id: string;
  kakao_id: string;
  nickname: string | null;
  profile_image_url: string | null;
  is_admin: boolean;
}
