// src/lib/types/userProfileUpdate.ts

export interface StandardAPIResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
  timestamp: number;
  path: string;
}

// --- REQUEST TYPES ---

export interface UserProfileUpdateUserData {
  username: string;
  designation: string;
  summary: string;
}

export interface UserProfileUpdateRequest {
  profilePicture: File | null;
  coverPhoto: File | null;
  userData: UserProfileUpdateUserData;
}

// --- RESPONSE TYPES ---

/**
 * Raw Data Transfer Object returned on a successful profile update.
 */
export interface UserProfileUpdatePayloadDTO {
  userId: number;
  email: string;
  username: string;
  designation: string | null;
  summary: string | null;
  profilePictureUrl: string | null;
  coverPhotoUrl: string | null;
}

/**
 * Frontend Mapped Response (normalized, guaranteed non-null strings for required fields).
 */
export interface MappedUserProfileUpdateResponse {
  userId: number;
  email: string;
  username: string;
  designation: string;
  summary: string;
  profilePictureUrl: string;
  coverPhotoUrl: string;
}

export type UserProfileUpdateResponse = StandardAPIResponse<UserProfileUpdatePayloadDTO>;

export interface UserProfileUpdateControllerResult {
  success: boolean;
  data?: MappedUserProfileUpdateResponse;
  message: string;
  errors: string[];
  statusCode?: number;
}