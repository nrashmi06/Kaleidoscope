import axios,  { AxiosError } from "axios";
import { PostCommentMapper } from "@/mapper/postCommentMapper";
import {
  AddCommentRequest,
  AddCommentResponse,
} from "@/lib/types/comment";
import { axiosInstance } from "@/hooks/axios";

/**
 * Service to add a comment to a post.
 */
export const addCommentService = async (
  postId: number,
  accessToken: string,
  payload: AddCommentRequest
): Promise<AddCommentResponse> => {
  const url = PostCommentMapper.addComment(postId);

  try {
    const response = await axiosInstance.post<AddCommentResponse>(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("[addCommentService] Error:", error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<AddCommentResponse>;
      return (
        axiosError.response?.data || {
          success: false,
          message: "Failed to add comment",
          errors: [axiosError.message],
          data: null,
          timestamp: Date.now(),
          path: `/api/posts/${postId}/comments`,
        }
      );
    }

    // Fallback for unexpected errors
    return {
      success: false,
      message: "Unexpected error while adding comment",
      errors: ["Unknown error"],
      data: null,
      timestamp: Date.now(),
      path: `/api/posts/${postId}/comments`,
    };
  }
};
