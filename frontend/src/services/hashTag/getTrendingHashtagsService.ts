// src/services/hashTag/getTrendingHashtagsService.ts
import { HashtagMapper } from "@/mapper/hashtagMapper";
import type {
  TrendingHashtagRequestParams,
  TrendingHashtagResponse,
} from "@/lib/types/trendingHashtag";
// ✅ 1. Import axios instance and error types
import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";

/**
 * Fetches a paginated list of trending hashtags from the API.
 * @param params - Query parameters for page, size, and filter.
 * @param accessToken - The user's JWT.
 * @returns A promise resolving to the full API response.
 */
export const getTrendingHashtagsService = async (
  params: TrendingHashtagRequestParams,
  accessToken: string
): Promise<TrendingHashtagResponse> => {
  // ✅ 2. Get the base endpoint from the mapper
  const endpoint = HashtagMapper.getTrendingHashtags();

  // ✅ 3. Define the axios config
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    // Axios will automatically build the query string from this object
    // and will ignore any undefined/null values
    params: {
      page: params.page,
      size: params.size,
      filter: params.filter,
    },
  };

  try {
    // ✅ 4. Use axiosInstance.get
    // The interceptor will handle 401s automatically
    const response = await axiosInstance.get<TrendingHashtagResponse>(
      endpoint,
      config
    );

    // ✅ 5. Return the response data directly
    // axios throws an error for non-2xx responses, so we go to catch()
    return response.data;

  } catch (error) {
    // ✅ 6. Handle errors, including Axios-specific errors
    const errorMessage =
      error instanceof Error ? error.message : "An unknown network error occurred";
    console.error("[getTrendingHashtagsService] Error:", errorMessage);

    // 7. Check if it's an AxiosError to return the structured error from the API
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<TrendingHashtagResponse>;
      // If the backend sent a standard error response, return it
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
    }

    // ✅ 8. Return the same normalized error structure as the original fetch function
    return {
      success: false,
      message: errorMessage,
      data: null,
      errors: [errorMessage],
      timestamp: Date.now(),
      path: endpoint,
    };
  }
};