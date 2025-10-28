import { getCommentReactionsService } from "@/services/postInteractionService/getCommentReactionsService";
import { ReactionSummaryResponse } from "@/lib/types/reaction";

/**
 * Controller to get all reactions for a specific comment
 */
export const getCommentReactionsController = async (
  postId: number,
  commentId: number,
  accessToken: string
): Promise<ReactionSummaryResponse> => {
  try {
    const response = await getCommentReactionsService.getReactionsForComment(
      postId,
      commentId,
      accessToken
    );

    return response;
  } catch (error) {
    console.error("[getCommentReactionsController] Error:", error);

    return {
      success: false,
      message: "Unexpected error in comment reactions controller",
      errors: [String(error)],
      data: null,
      timestamp: Date.now(),
      path: `/api/posts/${postId}/comments/${commentId}/reactions`,
    };
  }
};
