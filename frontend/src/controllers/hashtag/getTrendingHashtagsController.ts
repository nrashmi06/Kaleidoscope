// src/controllers/hashtag/getTrendingHashtagsController.ts
import { getTrendingHashtagsService } from "@/services/hashTag/getTrendingHashtagsService";
import type { 
  TrendingHashtag, 
  TrendingHashtagRequestParams 
} from "@/lib/types/trendingHashtag";

/**
 * Normalized pagination info for frontend components.
 */
export interface NormalizedPagination {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

/**
 * Normalized response structure for the trending hashtags UI component.
 */
export interface TrendingHashtagsControllerResult {
  success: boolean;
  hashtags: TrendingHashtag[];
  pagination: NormalizedPagination;
  error?: string;
}

// Default pagination for empty or error states
const defaultPagination: NormalizedPagination = {
  currentPage: 0,
  totalPages: 0,
  totalElements: 0,
  first: true,
  last: true,
};

/**
 * Fetches trending hashtags and normalizes the response for UI consumption.
 * @param params - Query parameters for page, size, and filter.
 * @param accessToken - The user's JWT.
 * @returns A normalized result object for the frontend.
 */
export const getTrendingHashtagsController = async (
  params: TrendingHashtagRequestParams,
  accessToken: string
): Promise<TrendingHashtagsControllerResult> => {
  try {
    const response = await getTrendingHashtagsService(params, accessToken);

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to load hashtags");
    }

    const { data } = response;
    
    return {
      success: true,
      hashtags: data.content,
      pagination: {
        currentPage: data.page,
        totalPages: data.totalPages,
        totalElements: data.totalElements,
        first: data.first,
        last: data.last,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return {
      success: false,
      hashtags: [],
      pagination: defaultPagination,
      error: errorMessage,
    };
  }
};