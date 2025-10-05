import { filterPostsService, PostFilterOptions } from "@/services/post/filterPosts";
import { FetchPostsResponse } from "@/services/post/fetchPosts";

export const filterPostsController = async (
  accessToken: string,
  filterOptions?: PostFilterOptions
): Promise<{ success: boolean; data?: FetchPostsResponse; error?: string }> => {
  try {
    console.log('[PostController] Filtering posts with options:', filterOptions);
    
    const result = await filterPostsService(accessToken, filterOptions);
    
    if (!result.success) {
      console.error('[PostController] Failed to filter posts:', result.error);
      return {
        success: false,
        error: result.error || "Failed to filter posts",
      };
    }
    
    console.log('[PostController] Posts filtered successfully:', result.data?.data.content.length, 'posts found');
    return result;
    
  } catch (error) {
    console.error('[PostController] Error in filterPostsController:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};
