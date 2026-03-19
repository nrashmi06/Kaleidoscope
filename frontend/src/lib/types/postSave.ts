export interface StandardApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: string[];
  timestamp: number;
  path: string;
}

export interface PostSaveData {
  postId: number;
  userId: number;
  saved: boolean;
  savedAt?: string;
}

export type PostSaveStatusResponse = StandardApiResponse<PostSaveData>;
export type PostSaveToggleResponse = StandardApiResponse<PostSaveData>;

export interface SavedPostItem {
  postId: number;
  title: string;
  caption: string;
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
}

export interface SavedPostsPaginatedData {
  content: SavedPostItem[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

export type GetSavedPostsResponse = StandardApiResponse<SavedPostsPaginatedData>;
