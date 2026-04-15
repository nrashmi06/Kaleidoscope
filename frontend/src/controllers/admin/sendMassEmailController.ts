import sendMassEmail from "@/services/admin/sendMassEmail";

export async function sendMassEmailController(
  data: { subject: string; body: string; targetRoles: string[]; attachments?: File[] },
  accessToken: string
) {
  if (!accessToken) return { success: false, message: "Not authenticated." };
  if (!data.subject.trim() || !data.body.trim()) return { success: false, message: "Subject and body are required." };
  try {
    const res = await sendMassEmail(data, accessToken);
    return { success: res.success, message: res.message || (res.success ? "Mass email sent successfully." : "Failed to send mass email.") };
  } catch {
    return { success: false, message: "An unexpected error occurred." };
  }
}
