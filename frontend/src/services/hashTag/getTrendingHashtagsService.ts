// src/services/hashTag/getTrendingHashtagsService.ts
import { HashtagMapper } from "@/mapper/hashtagMapper";
import type { 
  TrendingHashtagRequestParams, 
  TrendingHashtagResponse 
} from "@/lib/types/trendingHashtag";

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
  const url = new URL(HashtagMapper.getTrendingHashtags());
  
  // Build query parameters safely
  if (params.page !== undefined) url.searchParams.append("page", String(params.page));
  if (params.size !== undefined) url.searchParams.append("size", String(params.size));
  if (params.filter) url.searchParams.append("filter", params.filter);

  const endpoint = url.toString();

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data: TrendingHashtagResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch trending hashtags");
    }

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown network error occurred";
    console.error("[getTrendingHashtagsService] Error:", errorMessage);
    
    // Return a normalized error structure
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