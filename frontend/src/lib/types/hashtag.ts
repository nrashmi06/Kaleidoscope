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

// --------------------------------------
// ✅ MAPPED TYPES FOR FRONTEND USE
// --------------------------------------
export interface HashtagSuggestion {
  hashtagId: number;
  name: string;
  usageCount: number;
}

// Request parameters for hashtag suggestions
export interface HashtagSuggestionParams {
  prefix: string;
  page?: number;
  size?: number;
}

// Hashtag error types for better error handling
export enum HashtagErrorType {
  INVALID_PREFIX = 'INVALID_PREFIX',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Custom error class for hashtag API operations
export class HashtagApiError extends Error {
  public readonly type: HashtagErrorType;
  public readonly statusCode?: number;
  public readonly errors: string[];

  constructor(
    message: string,
    type: HashtagErrorType,
    statusCode?: number,
    errors: string[] = []
  ) {
    super(message);
    this.name = 'HashtagApiError';
    this.type = type;
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

// UI state for hashtag autocomplete component
export interface HashtagAutocompleteState {
  suggestions: HashtagSuggestion[];
  isLoading: boolean;
  error: string | null;
  showDropdown: boolean;
  selectedIndex: number;
}
