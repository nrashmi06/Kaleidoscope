import { filterPostsService } from "@/services/post/filterPosts";
// The 'PostFilterParams' import is now used
import type { PostFilterParams } from "@/lib/types/postFeed";
import { FetchPostsResponse } from "@/services/post/fetchPosts";

export const filterPostsController = async (
  accessToken: string,
  // ✅ FIX 1: Renamed 'PostFilterOptions' to 'PostFilterParams'
  filterOptions?: PostFilterParams
): Promise<{ success: boolean; data?: FetchPostsResponse; error?: string }> => {
  try {
    console.log('[PostController] Filtering posts with options:', filterOptions);
    
    const result = await filterPostsService(accessToken, filterOptions);
    
    if (!result.success) {
      // ✅ FIX 2: Changed 'result.error' to 'result.message'
      console.error('[PostController] Failed to filter posts:', result.message);
      return {
        success: false,
        // ✅ FIX 3: Changed 'result.error' to 'result.message'
        error: result.message || "Failed to filter posts",
      };
    }
    
    console.log('[PostController] Posts filtered successfully:', result.data?.content.length, 'posts found');
    
    // The service result already matches the controller's return type
    return {
      success: true,
      data: result.data ? result : undefined, // 'result' is the full FetchPostsResponse (which is FilterPostsResult)
    };
    
  } catch (error) {
    console.error('[PostController] Error in filterPostsController:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};