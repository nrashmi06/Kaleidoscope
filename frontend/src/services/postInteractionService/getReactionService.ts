import axios, { AxiosError } from "axios";
import { PostReactionMapper } from "@/mapper/postReactionMapper";
import { ReactionSummaryResponse } from "@/lib/types/reaction";
import { axiosInstance } from "@/hooks/axios";

/**
 * Fetches the reaction summary for a given post.
 * @param postId - The unique ID of the post
 * @param accessToken - Optional access token for authenticated requests
 * @returns A structured ReactionSummaryResponse
 */
export const getReactionsForPost = async (
  postId: number,
  accessToken?: string
): Promise<ReactionSummaryResponse> => {
  try {
    const response = await axiosInstance.get<ReactionSummaryResponse>(
      PostReactionMapper.getReactionsForPost(postId),
      {
        withCredentials: true, // in case your backend uses cookies
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("[getReactionsForPost] Error:", error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ReactionSummaryResponse>;
      return (
        axiosError.response?.data || {
          success: false,
          message: "Failed to fetch reactions",
          errors: [axiosError.message],
          data: null,
          timestamp: Date.now(),
          path: `/api/posts/${postId}/reactions`,
        }
      );
    }

    // Fallback for unexpected errors
    return {
      success: false,
      message: "Unexpected error fetching post reactions",
      errors: ["Unknown error"],
      data: null,
      timestamp: Date.now(),
      path: `/api/posts/${postId}/reactions`,
    };
  }
};
