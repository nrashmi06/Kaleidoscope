import { deletePostService } from "@/services/post/deletePost";

export const deletePostController = async (
  accessToken: string,
  postId: number,
  hardDelete: boolean = false
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log("[Controller] Deleting post:", postId, hardDelete ? "(hard delete)" : "(soft delete)");
    const result = await deletePostService(accessToken, postId, hardDelete);

    if (!result.success) {
      console.error("[Controller] Failed to delete post:", result.error);
      return { success: false, error: result.error || "Failed to delete post" };
    }

    console.log("[Controller] Post deleted successfully");
    return { success: true };
  } catch (error) {
    console.error("[Controller] Error in deletePostController:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error occurred",
    };
  }
};
