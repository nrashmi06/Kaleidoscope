import { hardDeleteBlogService } from "@/services/blog/hardDeleteBlog";

export async function hardDeleteBlogController(accessToken: string, blogId: number) {
  if (!accessToken) return { success: false, message: "Not authenticated." };
  try {
    const res = await hardDeleteBlogService(blogId, accessToken);
    return { success: res.success, message: res.message || (res.success ? "Blog permanently deleted." : "Failed to delete blog.") };
  } catch {
    return { success: false, message: "An unexpected error occurred." };
  }
}
