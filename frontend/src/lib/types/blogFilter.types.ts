// types/blogFilter.types.ts

// --- Re-defining StandardAPIResponse for explicit adherence ---
export interface StandardApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
  timestamp: number;
  path: string;
}

// --- Nested Types ---

/**
 * Union type for blog post status.
 */
export type BlogStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

/**
 * Union type for blog post visibility.
 */
export type BlogVisibility = "PUBLIC" | "FOLLOWERS" | "PRIVATE";

/**
 * Author summary as returned in the blog item.
 */
export interface BlogAuthor {
  userId: number;
  email: string;
  username: string;
  accountStatus: string;
  profilePictureUrl: string;
}

/**
 * Category summary attached to the blog item.
 */
export interface CategorySummary {
  categoryId: number;
  name: string;
}

/**
 * Represents a single blog item in the filtered list.
 */
export interface BlogItem {
  blogId: number;
  title: string;
  summary: string;
  createdAt: string; // ISO date string
  author: BlogAuthor;
  categories: CategorySummary[];
  thumbnailUrl: string;
  reactionCount: number;
  commentCount: number;
  viewCount: number;
  blogStatus: BlogStatus;
}

/**
 * Standard pagination metadata structure.
 */
export interface PaginationMeta {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

/**
 * The data payload containing the list of blogs and pagination info.
 */
export interface BlogFilterResponsePayload extends PaginationMeta {
  content: BlogItem[];
}

/**
 * The query parameters for the GET /api/blogs/filter endpoint.
 */
export interface BlogFilterRequest {
  page?: number;
  size?: number;
  sort?: string;
  userId?: number;
  categoryId?: number;
  status?: BlogStatus;
  visibility?: BlogVisibility;
  q?: string;
}

/**
 * The full API response for a successful filter operation.
 */
export type BlogFilterResponse = StandardApiResponse<BlogFilterResponsePayload>;

/**
 * The normalized result returned by the controller for the UI.
 */
export interface BlogFilterControllerResult {
  success: boolean;
  blogs: BlogItem[];
  pagination: PaginationMeta;
  error?: string;
}