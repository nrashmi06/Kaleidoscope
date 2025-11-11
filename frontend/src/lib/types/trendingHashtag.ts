// src/lib/types/trendingHashtag.ts
import type { StandardAPIResponse } from "./user-blocks"; // Re-using your global type

/**
 * Interface for a single trending hashtag object.
 */
export interface TrendingHashtag {
  hashtagId: number;
  name: string;
  usageCount: number;
}

/**
 * Interface for the 'data' payload in the API response.
 */
export interface TrendingHashtagPageData {
  content: TrendingHashtag[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

/**
 * The full API response structure for trending hashtags.
 */
export type TrendingHashtagResponse = StandardAPIResponse<TrendingHashtagPageData>;

/**
 * Type-safe request parameters for the service.
 */
export interface TrendingHashtagRequestParams {
  page?: number;
  size?: number;
  filter?: string;
}