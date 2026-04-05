import { getAllBlockedUsersAdmin } from "@/services/admin/getAllBlockedUsersAdmin";
import type { AdminBlocksPage } from "@/services/admin/getAllBlockedUsersAdmin";

interface GetAllBlockedUsersAdminResult {
  success: boolean;
  message: string;
  data?: AdminBlocksPage;
}

export const getAllBlockedUsersAdminController = async (
  accessToken: string,
  page: number = 0,
  size: number = 20
): Promise<GetAllBlockedUsersAdminResult> => {
  if (!accessToken) {
    return { success: false, message: "Authentication token is missing." };
  }

  try {
    const response = await getAllBlockedUsersAdmin(page, size, accessToken);

    if (response.success && response.data) {
      return {
        success: true,
        message: response.message || "Blocked users retrieved successfully.",
        data: response.data,
      };
    } else {
      return {
        success: false,
        message:
          response.message || "An error occurred while fetching blocked users.",
      };
    }
  } catch (error: unknown) {
    console.error("[getAllBlockedUsersAdminController] Unexpected error:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
};
