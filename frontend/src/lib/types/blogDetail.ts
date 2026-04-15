import {
  AuthorResponse,
  MediaResponse,
  LocationResponse,
  CategorySummary,
  BlogTagSummary,
} from "./createBlog";

interface NullableApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: string[];
  timestamp: number;
  path: string;
}

export interface BlogDetailResponse {
  blogId: number;
  title: string;
  body: string;
  summary: string;
  wordCount: number;
  readTimeMinutes: number;
  blogStatus: "DRAFT" | "APPROVAL_PENDING" | "FLAGGED" | "ARCHIVED" | "REJECTED" | "PUBLISHED";
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  author: AuthorResponse;
  reviewer?: AuthorResponse;
  categories: CategorySummary[];
  media: MediaResponse[];
  location?: LocationResponse;
  blogTags: BlogTagSummary[];
  tags: BlogTagSummary[];
  reactionCount: number;
  commentCount: number;
  viewCount: number;
  currentUserReaction?: string | null;
}

export type GetBlogByIdResponse = NullableApiResponse<BlogDetailResponse>;

export interface BlogUpdateRequest {
  title?: string;
  body?: string;
  summary?: string;
  mediaDetails?: {
    mediaId?: number | null;
    url: string;
    mediaType: string;
    position: number;
    width?: number;
    height?: number;
    fileSizeKb?: number;
    durationSeconds?: number | null;
    extraMetadata?: Record<string, unknown>;
  }[];
  locationId?: number;
  categoryIds?: number[];
  blogTagIds?: number[];
}

export type UpdateBlogResponse = NullableApiResponse<string>;
export type DeleteBlogResponse = NullableApiResponse<string>;
export type BlogTaggedByResponse = NullableApiResponse<BlogDetailResponse[]>;
