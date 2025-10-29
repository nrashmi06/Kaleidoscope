import {deleteCommentService } from "@/services/postInteractionService/deleteCommentService";
import { DeleteCommentResponse } from "@/lib/types/comment";

/**
 * Controller to delete a comment on a post.
 */
export const deleteCommentController = async (
  postId: number,
  commentId: number,
  accessToken: string
): Promise<DeleteCommentResponse> => {
  try {
    const response = await deleteCommentService(postId, commentId, accessToken);
    return response;
  } catch (error) {
    console.error("[deleteCommentController] Error deleting comment:", error);
    return {
      success: false,
      message: "Unexpected error deleting comment",
      data: null,
      errors: ["Unknown error"],
      timestamp: Date.now(),
      path: `/api/posts/${postId}/comments/${commentId}`,
    };
  }
};
