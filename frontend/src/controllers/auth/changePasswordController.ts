import changePassword from "@/services/auth/changePassword";

export async function changePasswordController(
  data: { currentPassword: string; newPassword: string },
  accessToken: string
) {
  if (!accessToken) return { success: false, message: "Not authenticated." };
  try {
    const res = await changePassword(data, accessToken);
    return { success: res.success, message: res.message || (res.success ? "Password changed successfully." : "Failed to change password.") };
  } catch {
    return { success: false, message: "An unexpected error occurred." };
  }
}
