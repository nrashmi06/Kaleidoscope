// --------------------------------------
// ✅ CORE ENTITY: TaggableUser
// --------------------------------------
export interface TaggableUser {
  userId: number;
  email: string;
  username: string;
  accountStatus: string;           // e.g. "ACTIVE", "INACTIVE"
  profilePictureUrl: string;       // user profile image
}

// --------------------------------------
// ✅ PAGINATED DATA STRUCTURE
// --------------------------------------
export interface PaginatedTaggableUserData {
  content: TaggableUser[];   // list of users that can be tagged
  page: number;              // current page number
  size: number;              // number of users per page
  totalPages: number;        // total number of pages
  totalElements: number;     // total number of users
  first: boolean;            // is first page
  last: boolean;             // is last page
}

// --------------------------------------
// ✅ STANDARD API RESPONSE WRAPPER
// --------------------------------------
export interface StandardAPIResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors?: string[];
  timestamp: number;
  path: string;
}

// --------------------------------------
// ✅ FINAL RESPONSE TYPE
// for GET /api/users/taggable-users
// --------------------------------------
export type TaggableUsersResponse = StandardAPIResponse<PaginatedTaggableUserData>;
