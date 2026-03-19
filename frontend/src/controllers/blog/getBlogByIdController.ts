import { getBlogByIdService } from "@/services/blog/getBlogById";
import { GetBlogByIdResponse } from "@/lib/types/blogDetail";

export async function getBlogByIdController(
  accessToken: string,
  blogId: number
): Promise<GetBlogByIdResponse> {
  if (!accessToken) {
    return {
      success: false,
      message: "Authentication token is missing.",
      data: null,
      errors: ["Authentication token is missing."],
      timestamp: Date.now(),
      path: `/api/blogs/${blogId}`,
    };
  }
  return getBlogByIdService(accessToken, blogId);
}
