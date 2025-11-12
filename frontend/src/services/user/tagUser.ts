import axios, { AxiosError } from "axios";
import axiosInstance from "@/hooks/axios";
import { TagUserRequest, TagUserResponse } from "@/lib/types/post";


/** Backend error response shape for safe narrowing */
interface ApiErrorResponse {
  message?: string;
  status?: number;
  timestamp?: string | number;
  path?: string;
  errors?: unknown[];
}

/** Uniform return type */
interface TagUserResult {
  success: boolean;
  data?: TagUserResponse;
  error?: string;
}

/**
 * Tags a user on a post or comment.
 *
 * @param request - The user tagging request body
 * @param accessToken - JWT access token for authorization
 * @returns API response containing tagging result
 */
export const tagUserService = async (
  request: TagUserRequest,
  accessToken: string
): Promise<TagUserResult> => {
  try {
    console.log("[TagUserService] Tagging user:", request);

    const response = await axiosInstance.post<TagUserResponse>(
      "/api/users/tags",
      request,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const responseData = response.data;

    if (!responseData.success) {
      console.error("[TagUserService] Backend unsuccessful:", responseData.message);
      return {
        success: false,
        error: responseData.message || "Backend returned unsuccessful response",
      };
    }

    return {
      success: true,
      data: responseData,
    };
  } catch (error: unknown) {
    console.error("❌ [TagUserService] Error tagging user:", error);

    // ✅ Safely narrow Axios error
    if (axios.isAxiosError?.(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message =
        axiosError.response?.data?.message ??
        axiosError.message ??
        "Unknown API error";

      return {
        success: false,
        error: message,
      };
    }

    // ✅ Handle non-Axios errors
    const fallbackMessage =
      error instanceof Error ? error.message : "Unexpected network error";

    return {
      success: false,
      error: fallbackMessage,
    };
  }
};
