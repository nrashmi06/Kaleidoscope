export interface StandardApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: string[];
  timestamp: number;
  path: string;
}

export interface BlogSaveData {
  blogId: number;
  userId: number;
  saved: boolean;
  savedAt?: string;
}

export type BlogSaveStatusResponse = StandardApiResponse<BlogSaveData>;
export type BlogSaveToggleResponse = StandardApiResponse<BlogSaveData>;

export interface SavedBlogItem {
  blogId: number;
  title: string;
  summary: string;
  createdAt: string;
  author: {
    userId: number;
    email: string;
    username: string;
    accountStatus: string;
    profilePictureUrl: string;
  };
  categories: { categoryId: number; name: string }[];
  thumbnailUrl: string;
  reactionCount: number;
  commentCount: number;
  viewCount: number;
  blogStatus: string;
}

export interface SavedBlogsPaginatedData {
  content: SavedBlogItem[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

export type GetSavedBlogsResponse = StandardApiResponse<SavedBlogsPaginatedData>;
