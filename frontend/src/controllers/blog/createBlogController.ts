import { createBlog } from "@/services/blog/createBlogService";
import {
  BlogRequest,
  CreateBlogControllerResult,
} from "@/lib/types/createBlog";

export async function createBlogController(
  payload: BlogRequest,
  accessToken: string
): Promise<CreateBlogControllerResult> {

  if (!accessToken) {
    return { success: false, message: "Authentication token is missing." };
  }

  if (!payload.title.trim() || !payload.body.trim()) {
    return { success: false, message: "Title and body content are required." };
  }

  try {
    const result = await createBlog(payload, accessToken);

    if (result.success) {
      return {
        success: true,
        message: typeof result.message === "string" ? result.message : "Blog created successfully!",
        data: result.data,
      };
    }

    const errorMessage =
      (typeof result.message === "string" ? result.message : null) ||
      result.errors?.join(", ") ||
      "Failed to create blog due to server or validation error.";

    return {
      success: false,
      message: errorMessage,
      data: result.data,
    };

  } catch (error) {
    console.error("[BlogController] Exception during blog creation:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred during processing.",
    };
  }
}
