import getAllUsersByProfileStatus from "@/services/admin/getAllUsersByProfileStatus";

const VALID_STATUSES = ["ACTIVE", "SUSPENDED", "BANNED", "DEACTIVATED"];

export async function getAllUsersByProfileStatusController(
  accessToken: string,
  search: string = "",
  status: string = "",
  page: number = 0,
  size: number = 20
) {
  if (!accessToken) return { success: false, message: "Not authenticated.", data: null };

  if (status && !VALID_STATUSES.includes(status)) {
    return { success: false, message: "Invalid status filter.", data: null };
  }

  try {
    const res = await getAllUsersByProfileStatus(search, status, page, size, accessToken);
    return {
      success: res.success,
      message: res.message || (res.success ? "Users fetched successfully." : "Failed to fetch users."),
      data: res.data,
    };
  } catch {
    return { success: false, message: "An unexpected error occurred.", data: null };
  }
}
