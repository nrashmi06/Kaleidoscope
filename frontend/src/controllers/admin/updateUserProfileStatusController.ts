import updateUserProfileStatus from "@/services/admin/updateUserProfileStatus";

const VALID_STATUSES = ["ACTIVE", "SUSPENDED", "DEACTIVATED"];

export async function updateUserProfileStatusController(
  accessToken: string,
  userId: number,
  status: string
) {
  if (!accessToken) return { success: false, message: "Not authenticated." };

  if (!userId || userId <= 0) return { success: false, message: "Invalid user ID." };

  if (!VALID_STATUSES.includes(status)) {
    return { success: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` };
  }

  try {
    const res = await updateUserProfileStatus({ userId, status }, accessToken);
    return {
      success: res.success,
      message: res.message || (res.success ? "User status updated successfully." : "Failed to update user status."),
    };
  } catch {
    return { success: false, message: "An unexpected error occurred." };
  }
}
