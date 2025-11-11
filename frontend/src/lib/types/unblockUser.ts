// src/lib/types/unblockUser.ts

import type { StandardAPIResponse } from "./userBlockStatus";

/**
 * The request body for the DELETE /api/user-blocks/unblock endpoint.
 */
export interface UnblockUserRequest {
  userIdToUnblock: number;
}

/**
 * The full API response type for the unblock action.
 * The 'data' field is a simple success message string (or null on failure).
 */
export type UnblockUserApiResponse = StandardAPIResponse<string | null>;

/**
 * A simplified and normalized result type returned by the controller
 * for clean frontend consumption.
 */
export interface UnblockUserControllerResult {
  success: boolean;
  message: string;
}