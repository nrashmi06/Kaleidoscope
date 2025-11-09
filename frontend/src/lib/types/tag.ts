// Tag-related types for content tagging system

/**
 * Content types that can have user tags
 */
export type ContentType = "POST" | "BLOG" | "STORY" | "COMMENT";

/**
 * Raw tag data from API response
 */
export interface TagResponseDTO {
  tagId: number;
  taggedUserId: number;
  taggedUsername: string;
  taggerUserId: number;
  taggerUsername: string;
  contentType: ContentType;
  contentId: number;
  createdAt: string;
}

/**
 * Paginated response structure for tags
 */
export interface PaginatedTagResponse {
  content: TagResponseDTO[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

/**
 * Standard API response wrapper for tag endpoints
 */
export interface TagApiResponse {
  success: boolean;
  message: string;
  data: PaginatedTagResponse | null;
  errors: string[];
  timestamp: number;
  path: string;
}

/**
 * Query parameters for tag requests
 */
export interface TagQueryParams {
  page?: number;
  size?: number;
  sort?: string[];
}

/**
 * Parameters for fetching tags by content
 */
export interface TagsByContentParams {
  contentType: ContentType;
  contentId: number;
  queryParams?: TagQueryParams;
}

/**
 * Mapped tag data for frontend use
 */
export interface MappedTag {
  tagId: number;
  taggedUser: {
    userId: number;
    username: string;
  };
  taggerUser: {
    userId: number;
    username: string;
  };
  contentType: ContentType;
  contentId: number;
  createdAt: Date;
  formattedCreatedAt: string;
  isCurrentUser?: boolean; // Will be set by mapper if current user info is available
}

/**
 * Mapped paginated response for frontend use
 */
export interface MappedPaginatedTagResponse {
  tags: MappedTag[];
  pagination: {
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
    hasNext: boolean;
    hasPrevious: boolean;
    isFirst: boolean;
    isLast: boolean;
  };
}

/**
 * Error types specific to tag operations
 */
export type TagErrorType = 
  | "UNAUTHORIZED"
  | "CONTENT_NOT_FOUND"
  | "INVALID_CONTENT_TYPE"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

/**
 * Tag operation error
 */
export interface TagError {
  type: TagErrorType;
  message: string;
  details?: string[];
}
