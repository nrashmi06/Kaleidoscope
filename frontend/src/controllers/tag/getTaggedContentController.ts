import { getTaggedContentService } from "@/services/tag/getTaggedContent";

export async function getTaggedContentController(
  accessToken: string,
  userId: number,
  page?: number,
  size?: number
) {
  if (!accessToken) return { success: false, message: "Not authenticated." };
  try {
    const res = await getTaggedContentService(userId, accessToken, page, size);
    return { success: res.success, message: res.message, data: res.data };
  } catch {
    return { success: false, message: "An unexpected error occurred.", data: null };
  }
}
