import { getCategoryAnalyticsService } from "@/services/userInterest/getCategoryAnalytics";

export async function getCategoryAnalyticsController(
  accessToken: string,
  page?: number,
  size?: number
) {
  if (!accessToken) return { success: false, message: "Not authenticated." };
  try {
    const res = await getCategoryAnalyticsService(accessToken, page, size);
    return { success: res.success, message: res.message, data: res.data };
  } catch {
    return { success: false, message: "An unexpected error occurred.", data: null };
  }
}
