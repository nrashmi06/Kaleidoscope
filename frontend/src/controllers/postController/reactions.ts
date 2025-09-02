import { likePostService, unlikePostService, ReactToPostResponse } from "@/services/post/reactions";

export const likePostController = async (
  postId: number,
  accessToken: string
): Promise<{ success: boolean; data?: ReactToPostResponse; error?: string }> => {
  try {
    console.log(`[ReactionsController] Liking post ${postId}`);
    
    const result = await likePostService(postId, accessToken);
    
    if (!result.success) {
      console.error(`[ReactionsController] Failed to like post:`, result.error);
      return {
        success: false,
        error: result.error || "Failed to like post",
      };
    }
    
    console.log(`[ReactionsController] Post liked successfully`);
    return result;
    
  } catch (error) {
    console.error(`[ReactionsController] Error in likePostController:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};

export const unlikePostController = async (
  postId: number,
  accessToken: string
): Promise<{ success: boolean; data?: ReactToPostResponse; error?: string }> => {
  try {
    console.log(`[ReactionsController] Unliking post ${postId}`);
    
    const result = await unlikePostService(postId, accessToken);
    
    if (!result.success) {
      console.error(`[ReactionsController] Failed to unlike post:`, result.error);
      return {
        success: false,
        error: result.error || "Failed to unlike post",
      };
    }
    
    console.log(`[ReactionsController] Post unliked successfully`);
    return result;
    
  } catch (error) {
    console.error(`[ReactionsController] Error in unlikePostController:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};
