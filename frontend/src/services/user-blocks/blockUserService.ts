// src/services/user-blocks/blockUserService.ts

import axios, { AxiosError } from "axios";
import { UserBlocksMapper } from "@/mapper/userBlocksMapper";
import type { BlockUserRequest, BlockUserApiResponse } from "@/lib/types/user-blocks";

/**
 * Calls the API to block a user.
 *
 * @param payload - The request body containing userIdToBlock and reason.
 * @param accessToken - The authenticated user's JWT.
 * @returns The full API response (BlockUserApiResponse).
 */
export const blockUserService = async (
  payload: BlockUserRequest,
  accessToken: string
): Promise<BlockUserApiResponse> => {
  const url = UserBlocksMapper.blockUser;

  try {
    const response = await axios.post<BlockUserApiResponse>(
      url,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    // Return the successful data from the API
    return response.data;
  } catch (error) {
    console.error("[blockUserService] Error:", error);

    // Handle structured API errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<BlockUserApiResponse>;
      if (axiosError.response?.data) {
        // If the backend provides a structured error, return it
        return axiosError.response.data;
      }
    }

    // Fallback for network errors or other unexpected issues
    return {
      success: false,
      message: "Failed to block user. Please check your connection and try again.",
      data: null,
      errors: [error instanceof Error ? error.message : "Unknown error"],
      timestamp: Date.now(),
      path: url,
    };
  }
};