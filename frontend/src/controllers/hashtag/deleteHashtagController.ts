import { deleteHashtagService } from "@/services/hashTag/deleteHashtag";

export async function deleteHashtagController(
  accessToken: string,
  hashtagId: number
) {
  if (!accessToken) return { success: false, message: "Not authenticated." };
  try {
    const res = await deleteHashtagService(hashtagId, accessToken);
    return { success: res.success, message: res.message, data: res.data };
  } catch {
    return { success: false, message: "An unexpected error occurred.", data: null };
  }
}
