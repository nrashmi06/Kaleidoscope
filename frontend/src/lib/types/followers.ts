// src/lib/types/followers.ts
import { StandardAPIResponse } from "@/lib/types/auth";

/**
 * Core user data structure for a follower.
 */
export interface FollowerUser {
  userId: number;
  email: string;
  username: string;
  accountStatus: string;
  profilePictureUrl: string | null;
}

/**
 * The data payload received directly from the API response (FollowersResponsePayload).
 */
export interface FollowersResponsePayload {
  users: FollowerUser[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

/**
 * The full API response for fetching followers.
 */
export type GetFollowersAPIResponse = StandardAPIResponse<FollowersResponsePayload>;

/**
 * Parameters for the followers service/controller.
 */
export interface FetchFollowersParams {
  userId: number;
  page?: number;
  size?: number;
  sort?: string;
}