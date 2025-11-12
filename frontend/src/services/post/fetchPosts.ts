// src/services/post/fetchPosts.ts

import { filterPostsService, FilterPostsResult } from "./filterPosts";
import type { PostFilterParams, PaginatedPostsResponse } from "@/lib/types/postFeed";
// ✅ NEW IMPORT: Import the heavyweight Post type from the shared types file
import { Post } from "@/lib/types/post"; 

// ✅ Re-export types from filterPostsService for backward compatibility
export type FetchPostsResult = FilterPostsResult;
export type FetchPostsResponse = PaginatedPostsResponse;
// ✅ NEW EXPORT: Re-export the heavyweight Post type to satisfy consumers
export type { Post }; 

/**
 * Fetches posts. This service is now a lightweight wrapper.
 * It translates its legacy options into PostFilterParams
 * and calls the main filterPostsService.
 */
export const fetchPostsService = async (
  accessToken: string,
  options?: {
    page?: number;
    size?: number;
    sort?: string; 
    sortBy?: string; // (deprecated)
    sortDirection?: "ASC" | "DESC"; // (deprecated)
  }
): Promise<FetchPostsResult> => {
  
  // --- Adapt old 'options' to new 'PostFilterParams' ---
  let sortParams: string[] | undefined = undefined;

  if (options?.sort) {
    sortParams = [options.sort];
  } else if (options?.sortBy && options?.sortDirection) {
    sortParams = [`${options.sortBy},${options.sortDirection.toLowerCase()}`];
  } else if (options?.sortBy) {
    sortParams = [`${options.sortBy},desc`];
  }

  const filterOptions: PostFilterParams = {
    page: options?.page,
    size: options?.size,
    sort: sortParams,
    // Note: 'q', 'hashtag', 'categoryId', etc., are omitted
    // as this service was only for basic pagination.
  };
  // --- End adaptation ---

  // ✅ Call the single source of truth
  return filterPostsService(accessToken, filterOptions);
};

// We can keep the default export for any legacy imports
export default fetchPostsService;