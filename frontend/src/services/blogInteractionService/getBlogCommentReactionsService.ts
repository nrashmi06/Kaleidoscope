import { AxiosError } from "axios";
import axiosInstance, { isAxiosError } from "@/hooks/axios";
import { BlogCommentReactionMapper } from "@/mapper/blogCommentReactionMapper";
import { ReactionSummaryResponse } from "@/lib/types/reaction";

export async function getBlogCommentReactionsService(
  blogId: number,
  commentId: number,
  accessToken: string
): Promise<ReactionSummaryResponse> {
  const url = BlogCommentReactionMapper.getReactionsForComment(blogId, commentId);

  try {
    const response = await axiosInstance.get<ReactionSummaryResponse>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<ReactionSummaryResponse>;
      return axiosError.response?.data || {
        success: false,
        message: "Failed to fetch comment reactions",
        data: null,
        errors: [axiosError.message],
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error",
      data: null,
      errors: ["Unknown error"],
    };
  }
}
