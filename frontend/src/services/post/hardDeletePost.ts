import { PostMapper } from "@/mapper/postMapper";
import type { PostHardDeleteResponse } from "@/lib/types/post";
import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";

/**
 * Calls the hard-delete endpoint for a post (admin only).
 * This targets the hard-delete route: DELETE /posts/{postId}/hard
 */
export const hardDeletePostService = async (
  accessToken: string,
  postId: number
): Promise<PostHardDeleteResponse> => {
  const url = PostMapper.hardDeletePost(postId);

  const rawToken = accessToken ? accessToken.replace(/^Bearer\s+/i, "") : "";

  try {
    if (process.env.NODE_ENV === "development") {
      const masked = rawToken ? `***${rawToken.slice(-8)}` : "<no-token>";
      console.debug(
        "[hardDeletePostService] Hard deleting post:",
        url,
        "using token ending",
        masked
      );
    }

    const response = await axiosInstance.delete<PostHardDeleteResponse>(url, {
      headers: {
        ...(rawToken ? { Authorization: `Bearer ${rawToken}` } : {}),
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<PostHardDeleteResponse>;
      const responseData = axiosError.response?.data;

      console.error(
        "[hardDeletePostService] API error:",
        axiosError.response?.status,
        responseData
      );

      return {
        success: false,
        message: responseData?.message || "Failed to hard delete post",
        data: responseData?.data || null,
        errors: responseData?.errors || [],
        timestamp: responseData?.timestamp || Date.now(),
        path: responseData?.path || url,
      };
    }

    console.error("[hardDeletePostService] Network error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Network error",
      data: null,
      errors: [error instanceof Error ? error.message : "Network error"],
      timestamp: Date.now(),
      path: url,
    };
  }
};
