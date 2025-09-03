import { deletePostService } from "@/services/post/deletePost";

export const deletePostController = async (
  accessToken: string,
  postId: number,
  hardDelete: boolean = false
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('[PostController] Deleting post:', postId, hardDelete ? '(hard delete)' : '(soft delete)');
    
    const result = await deletePostService(accessToken, postId, hardDelete);
    
    if (!result.success) {
      console.error('[PostController] Failed to delete post:', result.error);
      return {
        success: false,
        error: result.error || "Failed to delete post",
      };
    }
    
    console.log('[PostController] Post deleted successfully');
    return result;
    
  } catch (error) {
    console.error('[PostController] Error in deletePostController:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};
