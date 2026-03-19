import { AxiosError } from "axios";
import axiosInstance, { isAxiosError } from "@/hooks/axios";
import { BlogCommentMapper } from "@/mapper/blogCommentMapper";
import { AddCommentRequest, AddCommentResponse } from "@/lib/types/comment";

export const addBlogCommentService = async (
  blogId: number,
  payload: AddCommentRequest,
  accessToken: string
): Promise<AddCommentResponse> => {
  const url = BlogCommentMapper.addComment(blogId);

  try {
    const response = await axiosInstance.post<AddCommentResponse>(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<AddCommentResponse>;
      return axiosError.response?.data || {
        success: false,
        message: "Failed to add comment",
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
