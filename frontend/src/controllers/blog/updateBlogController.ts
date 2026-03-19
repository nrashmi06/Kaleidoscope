import { updateBlogService } from "@/services/blog/updateBlog";
import { BlogUpdateRequest, UpdateBlogResponse } from "@/lib/types/blogDetail";

export async function updateBlogController(
  accessToken: string,
  blogId: number,
  payload: BlogUpdateRequest
): Promise<UpdateBlogResponse> {
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
  return updateBlogService(accessToken, blogId, payload);
}
