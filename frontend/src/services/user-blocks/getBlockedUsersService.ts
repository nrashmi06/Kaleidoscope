// src/services/user-blocks/getBlockedUsersService.ts

import axios, { AxiosError } from "axios";
import axiosInstance from "@/hooks/axios";
import { UserBlocksMapper } from "@/mapper/userBlocksMapper";
import type {
  BlockedUsersApiResponse,
  GetBlockedUsersParams,
} from "@/lib/types/blockedUsersList";

/** Shape of backend error response for safe Axios narrowing */
interface ApiErrorResponse {
  message?: string;
  status?: number;
  timestamp?: string | number;
  path?: string;
  errors?: string[];
}

/**
 * Fetches a paginated list of blocked users.
 *
 * @param params - Pagination and sorting parameters
 * @param accessToken - User's JWT access token
 * @returns Strictly typed BlockedUsersApiResponse
 */
export const getBlockedUsersService = async (
  params: GetBlockedUsersParams,
  accessToken: string
): Promise<BlockedUsersApiResponse> => {
  const { page, size, sort } = params;
  const url = UserBlocksMapper.getBlockedUsers(page, size, sort?.join(","));

  try {
    console.log(`[getBlockedUsersService] Fetching blocked users from: ${url}`);

    const response = await axiosInstance.get<BlockedUsersApiResponse>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const responseData = response.data;

    // ✅ Check backend success flag
    if (!responseData.success) {
      console.error("[getBlockedUsersService] Backend unsuccessful:", responseData.message);
      return {
        ...responseData,
        success: false,
        message: responseData.message || "Backend returned unsuccessful response",
        data: null,
        errors: responseData.errors ?? [],
        timestamp: Date.now(),
        path: url,
      };
    }

    return responseData;
  } catch (error: unknown) {
    console.error("[getBlockedUsersService] Error:", error);

    // ✅ Safely narrow Axios errors
    if (axios.isAxiosError?.(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message =
        axiosError.response?.data?.message ??
        axiosError.message ??
        "Unknown API error";

      return {
        success: false,
        message,
        data: null,
        errors: axiosError.response?.data?.errors ?? [],
        timestamp: Date.now(),
        path: url,
      };
    }

    // ✅ Handle non-Axios (unexpected) errors
    const fallbackMessage =
      error instanceof Error ? error.message : "Unexpected network error";

    return {
      success: false,
      message: fallbackMessage,
      data: null,
      errors: [fallbackMessage],
      timestamp: Date.now(),
      path: url,
    };
  }
};
