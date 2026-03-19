export interface StandardApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: string[];
  timestamp: number;
  path: string;
}

export interface UserInterestItem {
  userInterestId: number;
  categoryId: number;
  categoryName: string;
  createdAt: string;
}

export interface UserInterestPaginatedData {
  content: UserInterestItem[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

export type GetUserInterestsResponse = StandardApiResponse<UserInterestPaginatedData>;
export type AddUserInterestResponse = StandardApiResponse<null>;
export type RemoveUserInterestResponse = StandardApiResponse<null>;
export type BulkUserInterestResponse = StandardApiResponse<null>;
