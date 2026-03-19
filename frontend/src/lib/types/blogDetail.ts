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
  blogStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  author: AuthorResponse;
  categories: CategorySummary[];
  media: MediaResponse[];
  location?: LocationResponse;
  blogTags: BlogTagSummary[];
}

export type GetBlogByIdResponse = NullableApiResponse<BlogDetailResponse>;

export interface BlogUpdateRequest {
  title?: string;
  body?: string;
  summary?: string;
  mediaDetails?: {
    mediaId: number;
    url: string;
    mediaType: string;
    position: number;
    width: number;
    height: number;
    fileSizeKb: number;
    durationSeconds?: number | null;
    extraMetadata: Record<string, string>;
  }[];
  locationId?: number;
  categoryIds?: number[];
  blogTagIds?: number[];
}

export type UpdateBlogResponse = NullableApiResponse<string>;
export type DeleteBlogResponse = NullableApiResponse<string>;
export type BlogTaggedByResponse = NullableApiResponse<BlogDetailResponse[]>;
