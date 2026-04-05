import { removeBlockByIdAdmin } from "@/services/admin/removeBlockByIdAdmin";

interface RemoveBlockByIdAdminResult {
  success: boolean;
  message: string;
}

export const removeBlockByIdAdminController = async (
  accessToken: string,
  blockId: string
): Promise<RemoveBlockByIdAdminResult> => {
  if (!accessToken) {
    return { success: false, message: "Authentication token is missing." };
  }

  if (!blockId) {
    return { success: false, message: "Block ID is required." };
  }

  try {
    const response = await removeBlockByIdAdmin(blockId, accessToken);

    return {
      success: response.success,
      message:
        response.message ||
        (response.success
          ? "Block removed successfully."
          : "Failed to remove block."),
    };
  } catch (error: unknown) {
    console.error("[removeBlockByIdAdminController] Unexpected error:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
};
