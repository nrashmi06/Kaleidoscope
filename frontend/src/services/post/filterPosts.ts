// src/services/post/filterPosts.ts

import axios, { AxiosError } from "axios";
import { PostMapper } from "@/mapper/postMapper";

// ✅ Import strong types
import type { PostFilterParams, PaginatedPostsResponse } from "@/lib/types/postFeed";
import axiosInstance from "@/hooks/axios";

export type FilterPostsApiResponse = PaginatedPostsResponse;

// ✅ Define backend error shape for safer Axios narrowing
interface ApiErrorResponse {
  message?: string;
  status?: number;
  timestamp?: string | number;
  path?: string;
  errors?: unknown[];
}

// ✅ Define the unified return type
interface FilterPostsResult {
  success: boolean;
  data: PaginatedPostsResponse["data"] | null;
  message: string;
  errors?: unknown[];
  timestamp: number;
  path: string;
}

/**
 * Axios-based version of filterPostsService
 * Strictly typed, no any, no never.
 */
export const filterPostsService = async (
  accessToken: string,
  filterOptions: PostFilterParams = {}
): Promise<FilterPostsResult> => {
  const url = new URL(PostMapper.filterPosts);

  // --- Serialize query parameters safely ---
  Object.entries(filterOptions).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.append(key, String(value));
      }
    }
  });

  const endpoint = url.toString();
  console.log("✅ [filterPostsService] Filtering posts via:", endpoint);

  try {
    const response = await axiosInstance.get<PaginatedPostsResponse>(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      // Equivalent to fetch `cache: 'no-store'`
      // Ensures always fresh data in browsers
      params: Object.fromEntries(url.searchParams),
    });

    const responseData = response.data;

    // Handle backend-reported failures
    if (!responseData.success) {
      console.error("❌ [filterPostsService] Backend unsuccessful response:", responseData);
      return {
        success: false,
        message: responseData.message || "Backend returned unsuccessful response",
        data: null,
        errors: responseData.errors,
        timestamp: Date.now(),
        path: endpoint,
      };
    }

    // ✅ Successful response
    return {
      success: true,
      message: responseData.message,
      data: responseData.data,
      errors: responseData.errors,
      timestamp: responseData.timestamp,
      path: responseData.path,
    };

  } catch (error: unknown) {
    // ✅ Strictly narrow the error type
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message =
        axiosError.response?.data?.message ??
        axiosError.message ??
        "Unknown API error";

      console.error("❌ [filterPostsService] Axios error:", axiosError.response?.data);

      return {
        success: false,
        message,
        data: null,
        errors: axiosError.response?.data?.errors ?? [],
        timestamp: Date.now(),
        path: endpoint,
      };
    }

    // ✅ Handle unexpected non-Axios errors
    const fallbackMessage =
      error instanceof Error ? error.message : "Unexpected network error";

    console.error("❌ [filterPostsService] Unexpected error:", error);

    return {
      success: false,
      message: fallbackMessage,
      data: null,
      errors: [fallbackMessage],
      timestamp: Date.now(),
      path: endpoint,
    };
  }
};
