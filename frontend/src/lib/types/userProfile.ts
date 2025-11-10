// src/lib/types/userProfile.ts

import { PostAuthorResponseDTO, CategorySummaryResponseDTO } from "@/lib/types/post"; 

export interface StandardAPIResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
  timestamp: number;
  path: string;
}
/**
 * Follow status types returned by the backend.
 */
export type FollowStatus = "FOLLOWING" | "NOT_FOLLOWING" | "PENDING" | "NONE";

/**
 * Simplified Post structure used in the paginated list within the profile.
 */
export interface UserPost {
  postId: number;
  title: string;
  summary: string;
  visibility: "PUBLIC" | "PRIVATE" | "FOLLOWERS_ONLY";
  createdAt: string;
  author: PostAuthorResponseDTO;
  categories: CategorySummaryResponseDTO[];
  thumbnailUrl: string | null;
  hashtags: string[];
  reactionCount: number;
  commentCount: number;
  viewCount: number;
}

/**
 * Paginated posts structure
 */
export interface UserPostsPage {
  content: UserPost[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

/**
 * Raw User Profile Data from the API
 */
export interface UserProfileDTO {
  userId: number;
  username: string;
  profilePictureUrl: string | null;
  coverPhotoUrl: string | null;
  summary: string | null;
  designation: string | null;
  followerCount: number;
  followingCount: number;
  isPrivate: boolean;
  followStatus: FollowStatus;
  posts: UserPostsPage;
}

/**
 * Frontend Mapped User Profile Structure (guaranteed non-null fields)
 */
export interface MappedUserProfile {
  userId: number;
  username: string;
  profilePictureUrl: string; 
  coverPhotoUrl: string;     
  summary: string;
  designation: string;
  followerCount: number;
  followingCount: number;
  isPrivate: boolean;
  followStatus: FollowStatus;
  posts: UserPostsPage; 
}

/**
 * Final API Response Type
 */
export type UserProfileResponse = StandardAPIResponse<UserProfileDTO>;

/**
 * Result type for the controller, including structured success/error handling.
 */
export interface UserProfileControllerResult {
  success: boolean;
  data?: MappedUserProfile;
  message: string;
  errors: string[];
  statusCode?: number;
}