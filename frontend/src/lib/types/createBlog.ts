export interface StandardApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
  timestamp: number;
  path: string;
}

export type MediaType = "IMAGE" ; // Enum-like type from existing post.ts

// --------------------------------------------------------
// Nested Types for Request and Response Schemas
// --------------------------------------------------------

export interface MediaDetailsRequest {
  mediaId: number;
  url: string;
  mediaType: MediaType;
  position: number;
  width: number;
  height: number;
  fileSizeKb: number;
  durationSeconds?: number | null;
  extraMetadata: Record<string, string>;
}

export interface CategorySummary {
  categoryId: number;
  name: string;
}

export interface BlogTagSummary {
  blogId: number;
  title: string;
}

export interface AuthorResponse {
  userId: number;
  email: string;
  username: string;
  accountStatus: string;
  profilePictureUrl: string;
}

export interface MediaResponse {
  mediaId: number;
  mediaUrl: string;
  mediaType: MediaType;
  position: number;
  width: number;
  height: number;
  fileSizeKb: number;
  durationSeconds: number;
  extraMetadata: Record<string, string>;
  createdAt: string;
}

export interface LocationResponse {
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

// --------------------------------------------------------
// 1. Request Body Schema (POST /api/blogs)
// --------------------------------------------------------

export interface BlogRequest {
  title: string;
  body: string;
  summary: string;
  mediaDetails?: MediaDetailsRequest[];
  locationId?: number;
  categoryIds: number[];
  blogTagIds: number[];
}

// --------------------------------------------------------
// 2. Blog Data Response (4xx Error Payload / Detailed Success)
// --------------------------------------------------------

export interface BlogDataResponse {
  blogId: number;
  title: string;
  body: string;
  summary: string;
  wordCount: number;
  readTimeMinutes: number;
  blogStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  author: AuthorResponse;
  categories: CategorySummary[];
  media: MediaResponse[];
  location?: LocationResponse;
  blogTags: BlogTagSummary[];
}

// --------------------------------------------------------
// 3. Final Response Types
// --------------------------------------------------------

// 201 Success Response: data is a simple string message
export type CreateBlogSuccessResponse = StandardApiResponse<string>;

// Error Response: data contains the detailed BlogDataResponse
export type CreateBlogApiErrorResponse = StandardApiResponse<BlogDataResponse>;

// Combined type for the raw API service response
export type CreateBlogServiceResponse = CreateBlogSuccessResponse | CreateBlogApiErrorResponse;

// Controller's normalized result structure
export interface CreateBlogControllerResult {
  success: boolean;
  message: string;
  data?: BlogDataResponse | string;
}