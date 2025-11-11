// src/services/user-blocks/userBlockStatusService.ts

import axios, { AxiosError } from "axios";
import { UserBlocksMapper } from "@/mapper/userBlocksMapper";
import type {
  UserBlockStatusApiResponse,
  UserBlockStatusRequest,
} from "@/lib/types/userBlockStatus";

/**
 * Calls the API to check the block status of a target user.
 *
 * @param params - The request object containing targetUserId.
 * @param accessToken - The authenticated user's JWT.
 * @returns The full API response (UserBlockStatusApiResponse).
 */
export const userBlockStatusService = async (
  params: UserBlockStatusRequest,
  accessToken: string
): Promise<UserBlockStatusApiResponse> => {
  // Use the existing UserBlocksMapper and the new endpoint key
  const url = UserBlocksMapper.checkBlockStatus(params.targetUserId);

  try {
    const response = await axios.get<UserBlockStatusApiResponse>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    // Return the successful data from the API
    return response.data;
  } catch (error) {
    console.error("[userBlockStatusService] Error:", error);

    // Handle structured API errors from axios
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<UserBlockStatusApiResponse>;
      if (axiosError.response?.data) {
        // If the backend provides a structured error, return it
        return axiosError.response.data;
      }
    }

    // Fallback for network errors or other unexpected issues
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to check block status. Please check your connection.",
      data: null,
      errors: [error instanceof Error ? error.message : "Unknown error"],
      timestamp: Date.now(),
      path: url,
    };
  }
};