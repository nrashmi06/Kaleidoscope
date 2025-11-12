// src/services/user-blocks/unblockUserService.ts

import axios, { AxiosError } from "axios";
import { UserBlocksMapper } from "@/mapper/userBlocksMapper";
import type { 
  UnblockUserRequest, 
  UnblockUserApiResponse 
} from "@/lib/types/unblockUser";
import axiosInstance from "@/hooks/axios";

/**
 * Calls the API to unblock a user.
 *
 * @param payload - The request body containing userIdToUnblock.
 * @param accessToken - The authenticated user's JWT.
 * @returns The full API response (UnblockUserApiResponse).
 */
export const unblockUserService = async (
  payload: UnblockUserRequest,
  accessToken: string
): Promise<UnblockUserApiResponse> => {
  const url = UserBlocksMapper.unBlockUser;

  try {
    // For axios, a DELETE request with a body is sent using the 'data' property.
    const response = await axiosInstance.delete<UnblockUserApiResponse>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      data: payload, // Send payload in the 'data' field for DELETE
    });
    
    return response.data;

  } catch (error) {
    console.error("[unblockUserService] Error:", error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<UnblockUserApiResponse>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
    }

    // Fallback for network errors or other unexpected issues
    return {
      success: false,
      message: "Failed to unblock user. Please check connection and try again.",
      data: null,
      errors: [error instanceof Error ? error.message : "Unknown error"],
      timestamp: Date.now(),
      path: url,
    };
  }
};