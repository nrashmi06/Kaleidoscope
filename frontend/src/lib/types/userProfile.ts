// src/lib/types/userProfile.ts

import { PaginatedResponse } from "./post";
// ✅ 1. IMPORT 'CategorySummaryResponseDTO' FROM './post'
import { type CategorySummaryResponseDTO } from "./post"; 
// ✅ 2. REMOVED 'CategorySummaryResponseDTO' FROM THIS IMPORT
import { type NormalizedPostFeedItem } from "./postFeed"; 

export type FollowStatus = "FOLLOWING" | "NOT_FOLLOWING" | "PENDING";

// This is the raw Author type from the profile API
export interface PostAuthorResponseDTO {
  userId: number;
  email: string | null;
  username: string;
  accountStatus: string | null;
  profilePictureUrl: string | null;
}

// This is the raw Post type from the profile API
export interface UserPost {
  postId: number;
  title: string;
  summary: string;
  // This is the raw visibility type from the API
  visibility: "PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE";
  createdAt: string;
  author: PostAuthorResponseDTO;
  categories: CategorySummaryResponseDTO[]; // ✅ 3. This type is now correctly imported
  thumbnailUrl: string | null;
  hashtags: string[];
  reactionCount: number;
  commentCount: number;
  viewCount: number;
}

/**
 * The full API response for a user's profile.
 */
export interface UserProfileResponseDTO {
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
  posts: PaginatedResponse<UserPost>; // Uses the raw UserPost
}

export type UserProfileApiResponse = {
  success: boolean;
  message: string;
  data: UserProfileResponseDTO | null;
  // ... other fields
};

/**
 * The final, clean, mapped data structure for the frontend component.
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
  // The mapped data uses the correct type
  posts: PaginatedResponse<NormalizedPostFeedItem>;
}

export type UserProfileControllerResult = {
  success: boolean;
  data: MappedUserProfile | null;
  message?: string;
};