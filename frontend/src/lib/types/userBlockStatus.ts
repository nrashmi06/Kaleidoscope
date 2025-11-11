// src/lib/types/userBlockStatus.ts

/**
 * A generic wrapper for standardized API responses from the backend.
 * (This can be moved to a shared 'common.ts' file if used globally)
 */
export interface StandardAPIResponse<T> {
  success: boolean;
  message: string;
  data: T | null; // Null on failure or if no data
  errors?: string[];
  timestamp: number;
  path: string;
}

/**
 * The query parameters required for the service call.
 */
export interface UserBlockStatusRequest {
  targetUserId: number;
}

/**
 * The structure of the 'data' object in a successful API response.
 * We make blockId nullable, as it may not exist if isBlocked is false.
 */
export interface UserBlockStatusData {
  isBlocked: boolean;
  isBlockedBy: boolean;
  blockId: number | null;
}

/**
 * The full API response type returned directly from the service layer.
 */
export type UserBlockStatusApiResponse = StandardAPIResponse<UserBlockStatusData>;

/**
 * A simplified and normalized result type returned by the controller
 * for clean frontend consumption.
 */
export interface UserBlockStatusControllerResult {
  success: boolean;
  message: string;
  data?: UserBlockStatusData; // Optional data on success
}