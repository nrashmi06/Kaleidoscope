import axios, { AxiosError } from "axios";
import { PostCommentMapper } from "../../mapper/postCommentMapper"
import { DeleteCommentResponse } from "../../lib/types/comment";

/**
 * Service to delete a comment from a post.
 */ 
export const deleteCommentService = async (
  postId: number,
  commentId: number,
  accessToken: string
): Promise<DeleteCommentResponse> => {
  const url = PostCommentMapper.deleteComment(postId, commentId);
  try {
    const response = await axios.delete(url, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  }  catch (error) {
    console.error("[deleteCommentService] Error:", error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<DeleteCommentResponse>;
      return (
        axiosError.response?.data || {
          success: false,
          message: "Failed to delete comment",
          errors: [axiosError.message],
          data: null,
          timestamp: Date.now(),
          path: `/api/posts/${postId}/comments/${commentId}`,
        }
      );
    }

    // Fallback for unexpected errors
    return {
      success: false,
      message: "Unexpected error deleting comment",
      errors: ["Unknown error"],
      data: null,
      timestamp: Date.now(),
      path: `/api/posts/${postId}/comments/${commentId}`,
    };
  }
};