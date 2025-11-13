// src/controllers/postController/fetchPosts.ts
import {
  fetchPostsService,
  FetchPostsResponse,
} from "@/services/post/fetchPosts";

// ⛔️ 'PostFilterParams' import is removed, fixing the "declared but its value is never read" error.

export const fetchPostsController = async (
  accessToken: string,
  options?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: "ASC" | "DESC";
  }
): Promise<{ success: boolean; data?: FetchPostsResponse; error?: string }> => {
  try {
    console.log("[PostController] Fetching posts with options:", options);

    const result = await fetchPostsService(accessToken, options);

    if (!result.success) {
      // ✅ FIX: Changed result.error to result.message
      console.error(
        "[PostController] Failed to fetch posts:",
        result.message
      );
      return {
        success: false,
        // ✅ FIX: Changed result.error to result.message
        error: result.message || "Failed to fetch posts",
      };
    }

    console.log(
      "[PostController] Posts fetched successfully:",
      result.data?.content.length,
      "posts"
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("[PostController] Error in fetchPostsController:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};