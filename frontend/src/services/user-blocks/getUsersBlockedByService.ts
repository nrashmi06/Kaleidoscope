// src/services/user-blocks/getUsersBlockedByService.ts

import axios, { AxiosError } from "axios";
import axiosInstance from "@/hooks/axios";
import { UserBlocksMapper } from "@/mapper/userBlocksMapper";
import type {
  UsersBlockedByApiResponse,
  GetUsersBlockedByParams,
} from "@/lib/types/usersBlockedBy";

/** Shape of backend error response for safe Axios narrowing */
interface ApiErrorResponse {
  message?: string;
  status?: number;
  timestamp?: string | number;
  path?: string;
  errors?: string[];
}

/**
 * Fetches a paginated list of users who have blocked the authenticated user.
 *
 * @param params - Pagination and sorting parameters
 * @param accessToken - User's JWT access token
 * @returns Strictly typed UsersBlockedByApiResponse
 */
export const getUsersBlockedByService = async (
  params: GetUsersBlockedByParams,
  accessToken: string
): Promise<UsersBlockedByApiResponse> => {
  const { page, size, sort } = params;
  const url = UserBlocksMapper.getUsersBlockedBy(page, size, sort?.join(","));

  try {
    console.log(`[getUsersBlockedByService] Fetching users who blocked the current user from: ${url}`);

    const response = await axiosInstance.get<UsersBlockedByApiResponse>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const responseData = response.data;

    // ✅ Check backend-reported success
    if (!responseData.success) {
      console.error("[getUsersBlockedByService] Backend unsuccessful:", responseData.message);
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
    console.error("[getUsersBlockedByService] Error:", error);

    // ✅ Narrow Axios errors safely
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

    // ✅ Handle unexpected (non-Axios) errors
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
