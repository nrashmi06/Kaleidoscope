import { CommentReactionMapper } from "@/mapper/commentReactionMapper"; // corrected import path
import {
  ReactionRequestBody,
  ReactionUpdateResponse,
  ReactionType,
} from "@/lib/types/reaction";
import axios, { AxiosError } from "axios";

export const reactToCommentService = {
  /* -------------------------------------------------------------------------- */
  /*                   POST: React or Unreact to a Comment                      */
  /* -------------------------------------------------------------------------- */
  async reactToComment(
    postId: number,
    commentId: number,
    reactionType: ReactionType,
    unreact: boolean,
    accessToken: string
  ): Promise<ReactionUpdateResponse> {
    try {
      const url = `${CommentReactionMapper.postReactionForComment(
        postId,
        commentId
      )}?unreact=${unreact}`;

      const body: ReactionRequestBody = { reactionType };

      const response = await axios.post<ReactionUpdateResponse>(url, body, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error) {
      console.error("[reactToComment] Error:", error);

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ReactionUpdateResponse>;
        return (
          axiosError.response?.data || {
            success: false,
            message: "Failed to react to comment",
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
        message: "Unexpected error reacting to comment",
        errors: ["Unknown error"],
        data: null,
        timestamp: Date.now(),
        path: `/api/posts/${postId}/comments/${commentId}/reactions`,
      };
    }
  },
};
