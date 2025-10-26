// Post related types based on backend DTOs

export interface MediaUploadRequestDTO {
  url: string;
  mediaType: "IMAGE" | "VIDEO";
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
  visibility: "PUBLIC" | "PRIVATE" | "FOLLOWERS_ONLY";
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
