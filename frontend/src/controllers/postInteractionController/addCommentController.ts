import { addCommentService } from "@/services/postInteractionService/addCommentService";
import {
  AddCommentRequest,
  AddCommentResponse,
} from "@/lib/types/comment";

/**
 * Controller: Add a comment to a specific post.
 *
 * Delegates the API call to `addCommentService`,
 * returning a standardized AddCommentResponse.
 */
export const addCommentController = async (
  postId: number,
  accessToken: string,
  payload: AddCommentRequest
): Promise<AddCommentResponse> => {
  if (!postId) {
    return {
      success: false,
      message: "Post ID is required",
      errors: ["Invalid postId"],
      data: null,
      timestamp: Date.now(),
      path: `/api/posts/${postId || "unknown"}/comments`,
    };
  }

  if (!accessToken) {
    return {
      success: false,
      message: "Missing access token. Please log in again.",
      errors: ["Unauthorized"],
      data: null,
      timestamp: Date.now(),
      path: `/api/posts/${postId}/comments`,
    };
  }

  try {
    const response = await addCommentService(postId, accessToken, payload);
    return response;
  } catch (error) {
    console.error("[addCommentController] Error:", error);

    return {
      success: false,
      message: "Unexpected error while adding comment",
      errors: ["Unknown controller error"],
      data: null,
      timestamp: Date.now(),
      path: `/api/posts/${postId}/comments`,
    };
  }
};
