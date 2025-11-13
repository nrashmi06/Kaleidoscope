// src/services/user/userProfileService.ts
import axios , { AxiosError } from "axios";
import axiosInstance from "@/hooks/axios";
import { UserMapper } from "@/mapper/userMapper";
// ✅ FIX: Change the imported type name
import { UserProfileApiResponse } from "@/lib/types/userProfile";

/** Shape of backend error response for safe Axios narrowing */
interface ApiErrorResponse {
  message?: string;
  status?: number;
  timestamp?: string | number;
  path?: string;
  errors?: string[];
}

/**
 * Fetches a user's profile, including their recent posts and follow status.
 * @param userId - The ID of the user whose profile to retrieve.
 * @param accessToken - Optional JWT token for authentication.
 * @returns Strictly typed Promise resolving to UserProfileApiResponse.
 */
export async function getUserProfileService(
  userId: number,
  accessToken?: string
// ✅ FIX: Use the correct type here
): Promise<UserProfileApiResponse> {
  const url = UserMapper.getUserProfile(userId);

  try {
    console.log(`[UserProfileService] Fetching profile for user: ${userId}`);

    // ✅ FIX: And use the correct type here for the axios generic
    const response = await axiosInstance.get<UserProfileApiResponse>(url, {
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        "Content-Type": "application/json",
      },
      // Equivalent to `fetch`'s cache: "no-store"
      // Ensures no cached results in SSR/CSR contexts
      params: { t: Date.now() }, // simple cache-buster
    });

    const responseData = response.data;

    // ✅ Ensure backend reported success
    if (!responseData.success) {
      const errorMessage =
        responseData.message || "Backend returned unsuccessful response";
      console.error("[UserProfileService] Backend unsuccessful:", errorMessage);

      return {
        ...responseData,
        success: false,
        message: errorMessage,
        data: null,
        errors: responseData.errors ?? [errorMessage],
        timestamp: Date.now(),
        path: url,
      };
    }

    return responseData;
  } catch (error: unknown) {
    console.error(`[UserProfileService] Error fetching profile for user ${userId}:`, error);

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
}