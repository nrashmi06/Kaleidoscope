// lib/types/hashtag.ts

// --------------------------------------
// ✅ CORE ENTITY: Hashtag
// --------------------------------------
export interface HashtagItem {
  hashtagId: number;
  name: string;         // e.g. "javascript"
  usageCount: number;   // how often this tag is used
}

// --------------------------------------
// ✅ PAGINATED DATA STRUCTURE
// --------------------------------------
export interface PaginatedHashtagData {
  content: HashtagItem[];   // list of hashtags
  page: number;             // current page number
  size: number;             // size of current page
  totalPages: number;       // total number of pages
  totalElements: number;    // total items
  first: boolean;           // whether first page
  last: boolean;            // whether last page
}

// --------------------------------------
// ✅ STANDARD API RESPONSE WRAPPER
// (same pattern used in your other modules)
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
// for GET /api/hashtags/suggest
// --------------------------------------
export type HashtagSuggestionsResponse = StandardAPIResponse<PaginatedHashtagData>;
