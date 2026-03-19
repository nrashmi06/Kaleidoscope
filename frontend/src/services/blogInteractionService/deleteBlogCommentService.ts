import { AxiosError } from "axios";
import axiosInstance, { isAxiosError } from "@/hooks/axios";
import { BlogCommentMapper } from "@/mapper/blogCommentMapper";
import { DeleteCommentResponse } from "@/lib/types/comment";

export const deleteBlogCommentService = async (
  blogId: number,
  commentId: number,
  accessToken: string
): Promise<DeleteCommentResponse> => {
  const url = BlogCommentMapper.deleteComment(blogId, commentId);

  try {
    const response = await axiosInstance.delete<DeleteCommentResponse>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<DeleteCommentResponse>;
      return axiosError.response?.data || {
        success: false,
        message: "Failed to delete comment",
        data: null,
        errors: [axiosError.message],
        timestamp: Date.now(),
        path: url,
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error",
      data: null,
      errors: ["Unknown error"],
      timestamp: Date.now(),
      path: url,
    };
  }
};
