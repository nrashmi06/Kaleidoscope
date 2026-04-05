import { hardDeletePostService } from "@/services/post/hardDeletePost";
import type { PostHardDeleteResponse } from "@/lib/types/post";

/**
 * Controller wrapper for hard deleting a post (admin only, permanent).
 * Returns the backend's standard response type so callers can inspect `success`.
 */
export const hardDeletePostController = async (
  accessToken: string,
  postId: number
): Promise<PostHardDeleteResponse> => {
  if (!accessToken) {
    return {
      success: false,
      message: "Authentication token is missing.",
      data: null,
      errors: ["Authentication token is missing."],
      timestamp: Date.now(),
      path: `/posts/${postId}/hard`,
    };
  }

  try {
    const result = await hardDeletePostService(accessToken, postId);
    return result;
  } catch (error: unknown) {
    console.error("[hardDeletePostController] Error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unexpected error occurred",
      data: null,
      errors: [
        error instanceof Error ? error.message : "Unexpected error occurred",
      ],
      timestamp: Date.now(),
      path: `/posts/${postId}/hard`,
    };
  }
};
