import { getContentTagsService } from "@/services/tag/getContentTags";

export async function getContentTagsController(
  accessToken: string,
  contentType: string,
  contentId: number
) {
  if (!accessToken) return { success: false, message: "Not authenticated." };
  try {
    const res = await getContentTagsService(contentType, contentId, accessToken);
    return { success: res.success, message: res.message, data: res.data };
  } catch {
    return { success: false, message: "An unexpected error occurred.", data: null };
  }
}
