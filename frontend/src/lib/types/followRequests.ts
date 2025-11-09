// src/lib/types/followRequests.ts
import { StandardAPIResponse } from "@/lib/types/auth";
import type { SuggestedUser } from "@/lib/types/followSuggestions";

/**
 * The core user data structure for a pending request is identical to SuggestedUser.
 * This represents the user who sent the follow request.
 */
export type FollowRequestUser = SuggestedUser; // ✅ FIX: Use type alias to resolve ESLint warning

// Paginated data structure for the requests list
export interface FollowRequestsPage {
  content: FollowRequestUser[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

// Final API response type for GET pending requests
export type GetPendingFollowRequestsResponse = StandardAPIResponse<FollowRequestsPage>;

// ✅ NEW: Response type for POST approve/reject request (data is a simple success message string)
export type FollowRequestActionResponse = StandardAPIResponse<string>; 

// Parameters for the service/controller
export interface GetPendingFollowRequestsParams {
  page?: number;
  size?: number;
  sort?: string[]; // Matches the API's expectation for the sort query param
}

// ✅ NEW: Parameters for the follow request action
export interface FollowRequestActionParams {
  requesterUserId: number;
}