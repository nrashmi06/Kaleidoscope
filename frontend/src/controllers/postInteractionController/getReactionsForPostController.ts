import { AxiosError } from "axios";
import { getReactionsForPost } from "@/services/postInteractionService/getReactionService";
import { ReactionSummaryResponse } from "@/lib/types/reaction";

/**
 * Controller that handles fetching reaction summary for a specific post.
 * Acts as an intermediary between the frontend UI and the service layer.
 *
 * @param postId - The unique ID of the post
 * @param accessToken - Optional access token for authenticated requests
 * @returns A standardized ReactionSummaryResponse
 */
export const getReactionsForPostController = async (
  postId: number,
  accessToken?: string
): Promise<ReactionSummaryResponse> => {
  try {
    const response = await getReactionsForPost(postId, accessToken);

    // Return the response in a consistent structure
    return {
      ...response,
      timestamp: Date.now(),
      path: `/api/posts/${postId}/reactions`,
    };
  } catch (error) {
    let message = "Failed to fetch post reactions";

    if (error instanceof AxiosError) {
      message = error.response?.data?.message || message;
    }

    return {
      success: false,
      message,
      data: null,
      errors: [message],
      timestamp: Date.now(),
      path: `/api/posts/${postId}/reactions`,
    };
  }
};
