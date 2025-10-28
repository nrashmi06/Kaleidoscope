import { CommentReactionMapper } from "@/mapper/commentReactionMapper";
import { ReactionSummaryResponse } from "@/lib/types/reaction";
import axios, { AxiosError } from "axios";

export const getCommentReactionsService = {
  /* -------------------------------------------------------------------------- */
  /*                       GET: Reactions Summary for Comment                   */
  /* -------------------------------------------------------------------------- */
  async getReactionsForComment(
    postId: number,
    commentId: number,
    accessToken: string
  ): Promise<ReactionSummaryResponse> {
    try {
      const url = CommentReactionMapper.getReactionsForComment(postId, commentId);
      const response = await axios.get<ReactionSummaryResponse>(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error) {
      console.error("[getReactionsForComment] Error:", error);

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ReactionSummaryResponse>;
        return (
          axiosError.response?.data || {
            success: false,
            message: "Failed to fetch comment reactions",
            errors: [axiosError.message],
            data: null,
            timestamp: Date.now(),
            path: `/api/posts/${postId}/comments/${commentId}/reactions`,
          }
        );
      }

      // Fallback for unexpected errors
      return {
        success: false,
        message: "Unexpected error fetching comment reactions",
        errors: ["Unknown error"],
        data: null,
        timestamp: Date.now(),
        path: `/api/posts/${postId}/comments/${commentId}/reactions`,
      };
    }
  },
};
