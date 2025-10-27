// lib/types/comment.ts

export type CommentStatus = "ACTIVE" | "DELETED" | "HIDDEN";
export type CommentContentType = "POST" | "COMMENT";

export interface CommentAuthor {
  userId: number;
  email: string;
  username: string;
  accountStatus: string;
  profilePictureUrl: string;
}

export interface CommentTag {
  tagId: number;
  taggedUserId: number;
  taggedUsername: string;
  taggerUserId: number;
  taggerUsername: string;
  contentType: CommentContentType;
  contentId: number;
  createdAt: string;
}

export interface CommentItem {
  commentId: number;
  contentId: number;
  contentType: CommentContentType;
  body: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
  tags: CommentTag[];
}

// Pagination meta
export interface PageableSort {
  unsorted: boolean;
  sorted: boolean;
  empty: boolean;
}

export interface PageableInfo {
  unpaged: boolean;
  paged: boolean;
  pageSize: number;
  pageNumber: number;
  offset: number;
  sort: PageableSort;
}

export interface PaginatedCommentData {
  totalPages: number;
  totalElements: number;
  numberOfElements: number;
  pageable: PageableInfo;
  size: number;
  content: CommentItem[];
  number: number;
  sort: PageableSort;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Standard API response wrapper
export interface StandardAPIResponse<T> {
  success: boolean;
  message?: string;
  data?: T | null;
  errors?: string[];
  timestamp?: number;
  path?: string;
}

// Final response type for GET /api/posts/{postId}/comments
export type CommentsListResponse = StandardAPIResponse<PaginatedCommentData>;
