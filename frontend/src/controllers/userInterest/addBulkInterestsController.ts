import { addBulkInterestsService } from "@/services/userInterest/addBulkInterests";

export async function addBulkInterestsController(
  categoryIds: number[],
  accessToken: string
) {
  if (!accessToken) return { success: false, message: "Not authenticated." };
  try {
    const res = await addBulkInterestsService(categoryIds, accessToken);
    return { success: res.success, message: res.message, data: res.data };
  } catch {
    return { success: false, message: "An unexpected error occurred.", data: null };
  }
}
