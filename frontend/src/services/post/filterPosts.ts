// src/services/post/filterPosts.ts
import { AxiosError } from "axios";
import { PostMapper } from "@/mapper/postMapper";
import type {
  PostFilterParams,
  PaginatedPostsResponse,
} from "@/lib/types/postFeed";
import { axiosInstance, isAxiosError } from "@/hooks/axios";

export type FilterPostsApiResponse = PaginatedPostsResponse;

// Define backend error shape for safer Axios narrowing
interface ApiErrorResponse {
  message?: string;
  status?: number;
  timestamp?: string | number;
  path?: string;
  errors?: string[]; // ✅ 1. Changed from unknown[]
}

// Define the unified return type
export interface FilterPostsResult {
  success: boolean;
  data: PaginatedPostsResponse["data"] | null;
  message: string;
  errors: string[]; // ✅ 2. Changed from unknown[] | undefined
  timestamp: number;
  path: string;
}

/**
 * Axios-based service to fetch and filter posts.
 * This version manually builds the query string to match your backend's requirements.
 */
export const filterPostsService = async (
  accessToken: string,
  filterOptions: PostFilterParams = {}
): Promise<FilterPostsResult> => {
  const url = new URL(PostMapper.filterPosts);

  // --- Robust Query Param Serialization ---
  Object.entries(filterOptions).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      if (Array.isArray(value)) {
        // Handle array values, like 'sort'
        value.forEach((v) => url.searchParams.append(key, String(v)));
      } else {
        // Handle primitive values
        url.searchParams.append(key, String(value));
      }
    }
  });

  const endpoint = url.toString();
  console.log("✅ [filterPostsService] Filtering posts via:", endpoint);

  try {
    const response = await axiosInstance.get<FilterPostsApiResponse>(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const responseData = response.data;

    // Handle backend-reported failures
    if (!responseData.success) {
      console.error(
        "❌ [filterPostsService] Backend unsuccessful response:",
        responseData
      );
      return {
        success: false,
        message:
          responseData.message || "Backend returned unsuccessful response",
        data: null,
        errors: responseData.errors ?? [], // ✅ 3. Ensure this is string[]
        timestamp: Date.now(),
        path: endpoint,
      };
    }

    // ✅ Successful response
    return {
      success: true,
      message: responseData.message,
      data: responseData.data,
      errors: responseData.errors ?? [], // ✅ 4. Ensure this is string[]
      timestamp: responseData.timestamp,
      path: responseData.path,
    };
  } catch (error: unknown) {
    if (isAxiosError<ApiErrorResponse>(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message =
        axiosError.response?.data?.message ??
        axiosError.message ??
        "Unknown API error";

      console.error(
        "❌ [filterPostsService] Axios error:",
        axiosError.response?.data
      );

      return {
        success: false,
        message,
        data: null,
        // ✅ 5. Ensure errors is a string array, even in failure
        errors: axiosError.response?.data?.errors ?? [message],
        timestamp: Date.now(),
        path: endpoint,
      };
    }

    const fallbackMessage =
      error instanceof Error ? error.message : "Unexpected network error";

    console.error("❌ [filterPostsService] Unexpected error:", error);

    return {
      success: false,
      message: fallbackMessage,
      data: null,
      errors: [fallbackMessage], // ✅ 6. Ensure this is string[]
      timestamp: Date.now(),
      path: endpoint,
    };
  }
};