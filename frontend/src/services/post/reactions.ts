import axiosInstance from "@/hooks/axios";
import axios, { AxiosError } from "axios";

// ✅ Define the exact backend response structure
export interface ReactToPostResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown> | null; // Avoid 'any'
  errors: unknown[];
}

/** ✅ Define error shape from backend */
interface ApiErrorResponse {
  message?: string;
  status?: number;
  timestamp?: string | number;
  path?: string;
  errors?: unknown[];
}

/** ✅ Define strict result type for our functions */
interface ReactToPostResult {
  success: boolean;
  data?: ReactToPostResponse;
  error?: string;
}

/**
 * ✅ Adds or updates a "LIKE" reaction on a post.
 */
export const likePostService = async (
  postId: number,
  accessToken: string
): Promise<ReactToPostResult> => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_BACKEND_URL ?? "";
  const endpoint = `${baseUrl}/api/posts/${postId}/reactions`;

  try {
    const response = await axiosInstance.post<ReactToPostResponse>(
      endpoint,
      { reactionType: "LIKE" },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const responseData = response.data;

    if (!responseData.success) {
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
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message =
        axiosError.response?.data?.message ??
        axiosError.message ??
        "Unknown API error";

      console.error("❌ [likePostService] Axios error:", axiosError.response?.data);

      return {
        success: false,
        error: message,
      };
    }

    const fallbackMessage =
      error instanceof Error ? error.message : "Unexpected network error";

    console.error("❌ [likePostService] Unexpected error:", error);

    return {
      success: false,
      error: fallbackMessage,
    };
  }
};

/**
 * ✅ Removes a "LIKE" (unreact) from a post.
 */
export const unlikePostService = async (
  postId: number,
  accessToken: string
): Promise<ReactToPostResult> => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_BACKEND_URL ?? "";
  const endpoint = `${baseUrl}/api/posts/${postId}/reactions?unreact=true`;

  try {
    const response = await axiosInstance.post<ReactToPostResponse>(
      endpoint,
      {}, // Sending empty object for CORS consistency
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const responseData = response.data;

    if (!responseData.success) {
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
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message =
        axiosError.response?.data?.message ??
        axiosError.message ??
        "Unknown API error";

      console.error("❌ [unlikePostService] Axios error:", axiosError.response?.data);

      return {
        success: false,
        error: message,
      };
    }

    const fallbackMessage =
      error instanceof Error ? error.message : "Unexpected network error";

    console.error("❌ [unlikePostService] Unexpected error:", error);

    return {
      success: false,
      error: fallbackMessage,
    };
  }
};
