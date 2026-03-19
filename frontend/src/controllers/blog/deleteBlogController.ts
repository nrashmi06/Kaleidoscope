import { deleteBlogService } from "@/services/blog/deleteBlog";
import { DeleteBlogResponse } from "@/lib/types/blogDetail";

export async function deleteBlogController(
  accessToken: string,
  blogId: number
): Promise<DeleteBlogResponse> {
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
  return deleteBlogService(accessToken, blogId);
}
