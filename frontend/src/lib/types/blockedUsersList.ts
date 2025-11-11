// src/lib/types/blockedUsersList.ts

import type { StandardAPIResponse } from "./userBlockStatus";
import type { BlockedUserSummary } from "./user-blocks";

/**
 * Re-exporting BlockedUserSummary for semantic clarity for this API.
 * This represents a user in the blocked list.
 */
export type BlockedUser = BlockedUserSummary;

/**
 * The query parameters for the GET /api/user-blocks/blocked request.
 */
export interface GetBlockedUsersParams {
  page: number;
  size: number;
  sort?: string[];
}

/**
 * The structure of the 'data' object in a successful API response.
 */
export interface BlockedUsersPage {
  blockedUsers: BlockedUser[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

/**
 * The full API response type returned from the service layer.
 */
export type BlockedUsersApiResponse = StandardAPIResponse<BlockedUsersPage>;

/**
 * A simplified and normalized result type returned by the controller
 * for clean frontend consumption.
 */
export interface BlockedUsersControllerResult {
  success: boolean;
  message: string;
  data?: BlockedUsersPage; // Contains users list + pagination
}