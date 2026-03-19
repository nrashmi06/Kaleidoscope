import { getBlogTaggedByService } from "@/services/blog/getBlogTaggedBy";
import { BlogTaggedByResponse } from "@/lib/types/blogDetail";

export async function getBlogTaggedByController(
  accessToken: string,
  blogId: number
): Promise<BlogTaggedByResponse> {
  if (!accessToken) {
    return {
      success: false,
      message: "Authentication token is missing.",
      data: null,
      errors: ["Authentication token is missing."],
      timestamp: Date.now(),
      path: `/api/blogs/${blogId}/tagged-by`,
    };
  }
  return getBlogTaggedByService(accessToken, blogId);
}
