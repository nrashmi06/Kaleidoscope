// src/lib/types/usersBlockedBy.ts

import type { StandardAPIResponse } from "./userBlockStatus";
import type { BlockedUserSummary } from "./user-blocks";

/**
 * Re-exporting BlockedUserSummary as BlockedByUser for semantic clarity.
 * This represents a user who has blocked the authenticated user.
 */
export type BlockedByUser = BlockedUserSummary;

/**
 * The query parameters for the GET /api/user-blocks/blocked-by request.
 */
export interface GetUsersBlockedByParams {
  page: number;
  size: number;
  sort?: string[];
}

/**
 * The structure of the 'data' object in a successful API response.
 * Note: The API response calls the list "blockedUsers", which is
 * the same key as the /blocked endpoint.
 */
export interface UsersBlockedByPage {
  blockedUsers: BlockedByUser[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

/**
 * The full API response type returned from the service layer.
 */
export type UsersBlockedByApiResponse = StandardAPIResponse<UsersBlockedByPage>;

/**
 * A simplified and normalized result type returned by the controller
 * for clean frontend consumption.
 */
export interface UsersBlockedByControllerResult {
  success: boolean;
  message: string;
  data?: UsersBlockedByPage; // Contains users list + pagination
}