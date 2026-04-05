import { updateBlogStatusService } from "@/services/blog/updateBlogStatus";

export async function updateBlogStatusController(accessToken: string, blogId: number, status: string) {
  if (!accessToken) return { success: false, message: "Not authenticated." };
  try {
    const res = await updateBlogStatusService(blogId, status, accessToken);
    return { success: res.success, message: res.message || (res.success ? "Blog status updated." : "Failed to update blog status.") };
  } catch {
    return { success: false, message: "An unexpected error occurred." };
  }
}
