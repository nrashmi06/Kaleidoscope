// src/lib/types/post.ts

export interface MediaUploadRequestDTO {
  url: string;
  mediaType: "IMAGE" | "VIDEO"; // video support is for furture adaptation
  position: number;
  width: number;
  height: number;
  fileSizeKb: number;
  durationSeconds?: number | null;
  extraMetadata?: Record<string, unknown>;
}

export interface PostCreateRequestDTO {
  title: string;
  body: string;
  summary: string;
  visibility: "PUBLIC" | "FOLLOWERS";
  locationId?: number | null;
  categoryIds: number[];
  mediaDetails?: MediaUploadRequestDTO[];
  taggedUserIds?: number[];
}

export interface UserSummaryResponseDTO {
  userId: number;
  username: string;
}

export interface CategorySummaryResponseDTO {
  categoryId: number;
  name: string;
}

export interface PostMediaResponseDTO {
  mediaId: number;
  mediaUrl: string;
  mediaType: "IMAGE";
  position: number;
  width: number;
  height: number;
  fileSizeKb: number;
  durationSeconds?: number | null;
  extraMetadata?: Record<string, unknown>;
  createdAt: string;
}

export interface LocationResponseDTO {
  locationId: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

export interface UserTagResponseDTO {
  userId: number;
  username: string;
  taggedAt: string;
}

export interface PostCreationResponseDTO {
  postId: number;
  title: string;
  body: string;
  summary: string;
  visibility: "PUBLIC" | "FOLLOWERS";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  author: UserSummaryResponseDTO;
  categories: CategorySummaryResponseDTO[];
  media: PostMediaResponseDTO[];
  location?: LocationResponseDTO | null;
  taggedUsers: UserTagResponseDTO[];
}

export interface StandardAPIResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
  timestamp: number;
  path: string;
}

export type CreatePostResponse = StandardAPIResponse<PostCreationResponseDTO>;

// Location types
export interface Location {
  locationId: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

// Nominatim response type
export interface NominatimLocation {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

// Combined location type for the UI
export interface LocationOption {
  id: string; // "backend-{locationId}" or "nominatim-{place_id}"
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  source: 'backend' | 'nominatim';
  locationId?: number; // only for backend locations
  placeId?: number; // only for nominatim locations
}

// Create location request
export interface CreateLocationRequestDTO {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  placeId?: number; // Nominatim place_id for deduplication
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

export type LocationsResponse = StandardAPIResponse<PaginatedResponse<Location>>;
export type CreateLocationResponse = StandardAPIResponse<Location>;

// User types for tagging
export interface User {
  userId: number;
  username: string;
  email?: string;
  accountStatus?: string;
}

export type UsersResponse = StandardAPIResponse<PaginatedResponse<User>>;

// Upload signature types
export interface GenerateUploadSignatureRequestDTO {
  fileNames: string[];
  contentType: string;
}

export interface UploadSignature {
  fileName: string;
  uploadUrl: string;
  cloudinaryPublicId: string;
}

export interface UploadSignatureResponseDTO {
  signatures: UploadSignature[];
  trackingIds: string[];
}

// types
export interface TagUserRequest {
  taggedUserId: number;
  contentType: "POST" | "COMMENT";
  contentId: number;
}

export interface TaggedUserData {
  tagId: number;
  taggedUserId: number;
  taggedUsername: string;
  taggerUserId: number;
  taggerUsername: string;
  contentType: string;
  contentId: number;
  createdAt: string;
}

export type TagUserResponse = StandardAPIResponse<TaggedUserData>;
export type UploadSignaturesResponse = StandardAPIResponse<UploadSignatureResponseDTO>;


/**
 * Request type for soft deleting a post.
 * Only the `postId` is required since it is passed in the route path.
 */
export interface PostSoftDeleteRequest {
  postId: number;
}

/**
 * Request type for hard deleting a post (Admin only).
 */
export interface PostHardDeleteRequest {
  postId: number;
}

export type PostSoftDeleteResponse = StandardAPIResponse<null>;
export type PostHardDeleteResponse = StandardAPIResponse<null>;

// Single Post API Types
export interface PostAuthorResponseDTO {
  userId: number;
  email: string;
  username: string;
  accountStatus: string;
  profilePictureUrl: string | null;
}

export interface PostLocationResponseDTO {
  locationId: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  state: string;
  city: string;
  address: string;
  placeId: string;
  createdAt: string;
}

export interface PostTaggedUserResponseDTO {
  tagId: number;
  taggedUserId: number;
  taggedUsername: string;
  taggerUserId: number;
  taggerUsername: string;
  contentType: string;
  contentId: number;
  createdAt: string;
}

export interface SinglePostResponseDTO {
  postId: number;
  title: string;
  body: string;
  summary: string;
  visibility: "PUBLIC" | "FOLLOWERS";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  author: PostAuthorResponseDTO;
  categories: CategorySummaryResponseDTO[];
  media: PostMediaResponseDTO[];
  location: PostLocationResponseDTO | null;
  taggedUsers: PostTaggedUserResponseDTO[];
  hashtags: string[];
  reactionCount: number;
  commentCount: number;
  viewCount: number;
  currentUserReaction: string | null;
}

export type SinglePostResponse = StandardAPIResponse<SinglePostResponseDTO>;


/**
 * This is the "heavy" post object used by UI components like SocialPostCard.
 * It is a consolidated type that can be populated from either a PostFeedItem
 * (via an adapter) or a SinglePostResponseDTO (via a mapper).
 */
export interface Post {
  postId: number;
  title: string;
  body: string; // Non-optional, adapter will provide summary as fallback
  summary: string;
  visibility: "PUBLIC" | "FOLLOWERS";
  createdAt: string; // ISO string
  updatedAt: string; // ISO string, adapter will provide createdAt as fallback
  author: {
    userId: number;
    username: string;
    profilePictureUrl?: string;
  };
  location?: {
    locationId: number;
    name: string;
    city: string;
    country: string;
  };
  categories: Array<{
    categoryId: number;
    name: string;
  }>;
  mediaDetails: Array<{ // Non-optional, will be [] if empty
    url: string;
    mediaType: "IMAGE" | "VIDEO";
    position: number;
    width: number;
    height: number;
    fileSizeKb: number;
    durationSeconds?: number | null;
    extraMetadata?: Record<string, unknown>;
  }>;
  taggedUsers: Array<{ // Non-optional, will be [] if empty
    userId: number;
    username: string;
  }>;
  hashtags: string[]; // <-- ADDED THIS
  thumbnailUrl?: string;
  commentCount: number;
  reactionCount: number; // Renamed from likeCount for consistency
  viewCount: number; // <-- ADDED THIS
  isLikedByCurrentUser?: boolean; // This is fine, as it's UI state
}