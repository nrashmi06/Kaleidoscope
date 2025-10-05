import { fetchPostsService, FetchPostsResponse } from "@/services/post/fetchPosts";

export const fetchPostsController = async (
  accessToken: string,
  options?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: "ASC" | "DESC";
  }
): Promise<{ success: boolean; data?: FetchPostsResponse; error?: string }> => {
  try {
    console.log('[PostController] Fetching posts with options:', options);
    
    const result = await fetchPostsService(accessToken, options);
    
    if (!result.success) {
      console.error('[PostController] Failed to fetch posts:', result.error);
      return {
        success: false,
        error: result.error || "Failed to fetch posts",
      };
    }
    
    console.log('[PostController] Posts fetched successfully:', result.data?.data.content.length, 'posts');
    return result;
    
  } catch (error) {
    console.error('[PostController] Error in fetchPostsController:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};
