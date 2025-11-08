import { deletePostService } from "@/services/post/deletePost";
import type { PostSoftDeleteResponse } from "@/lib/types/post";

/**
 * Controller wrapper for deleting a post (soft delete).
 * Returns the backend's standard response type so callers can inspect `success`.
 */
export const deletePostController = async (
  accessToken: string,
  postId: number
): Promise<PostSoftDeleteResponse> => {
  try {
    const result = await deletePostService(accessToken, postId);
    return result;
  } catch (error) {
    console.error("[Controller] Error in deletePostController:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error occurred",
      data: null,
      errors: [error instanceof Error ? error.message : "Unexpected error occurred"],
      timestamp: Date.now(),
      path: `/posts/${postId}`,
    };
  }
};
