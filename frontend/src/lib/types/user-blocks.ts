// src/lib/types/user-blocks.ts

/**
 * A generic wrapper for standardized API responses from the backend.
 */
export interface StandardAPIResponse<T> {
  success: boolean;
  message: string;
  data: T | null; // Null on failure
  errors?: string[];
  timestamp: number;
  path: string;
}

/**
 * Represents the summary of a user object found in the block response.
 */
export interface BlockedUserSummary {
  userId: number;
  email: string;
  username: string;
  accountStatus: string;
  profilePictureUrl: string;
}

/**
 * The required request body for the POST /api/user-blocks/block endpoint.
 */
export interface BlockUserRequest {
  userIdToBlock: number;
  reason: string;
}

/**
 * The structure of the 'data' object in a successful API response.
 */
export interface BlockUserResponseData {
  blockId: number;
  blocker: BlockedUserSummary;
  blocked: BlockedUserSummary;
  createdAt: string; // ISO 8601 date string
}

/**
 * The full API response type returned directly from the service layer.
 */
export type BlockUserApiResponse = StandardAPIResponse<BlockUserResponseData>;

/**
 * A simplified and normalized result type returned by the controller
 * for clean frontend consumption.
 */
export interface BlockUserControllerResult {
  success: boolean;
  message: string;
  data?: BlockUserResponseData;
} 