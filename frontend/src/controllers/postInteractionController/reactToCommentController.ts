import { reactToCommentService } from "@/services/postInteractionService/reactToCommentService";
import { ReactionType, ReactionUpdateResponse } from "@/lib/types/reaction";

/**
 * Controller to handle reacting or unreacting to a specific comment
 */
export const reactToCommentController = async (
  postId: number,
  commentId: number,
  reactionType: ReactionType,
  unreact: boolean,
  accessToken: string
): Promise<ReactionUpdateResponse> => {
  try {
    const response = await reactToCommentService.reactToComment(
      postId,
      commentId,
      reactionType,
      unreact,
      accessToken
    );

    return response;
  } catch (error) {
    console.error("[reactToCommentController] Error:", error);

    return {
      success: false,
      message: "Unexpected error in reactToCommentController",
      errors: [String(error)],
      data: null,
      timestamp: Date.now(),
      path: `/api/posts/${postId}/comments/${commentId}/reactions`,
    };
  }
};
