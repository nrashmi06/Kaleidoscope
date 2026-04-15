import axiosInstance, { isAxiosError, AxiosError } from "@/hooks/axios";
import { AdminMapper } from "@/mapper/adminMapper";

interface SendMassEmailRequest {
  subject: string;
  body: string;
  targetRoles: string[];
  attachments?: File[];
}

interface SendMassEmailResponse {
  success: boolean;
  message: string;
  data: unknown;
  errors: string[];
  timestamp: number;
  path: string;
}

export const sendMassEmail = async (
  data: SendMassEmailRequest,
  accessToken: string
): Promise<SendMassEmailResponse> => {
  const url = AdminMapper.sendMassEmail;

  try {
    const formData = new FormData();

    // Backend expects a JSON part named "emailData" with subject, body, targetRoles
    const emailData = {
      subject: data.subject,
      body: data.body,
      targetRoles: data.targetRoles,
    };
    formData.append(
      "emailData",
      new Blob([JSON.stringify(emailData)], { type: "application/json" })
    );

    if (data.attachments) {
      data.attachments.forEach((file) => {
        formData.append("attachments", file);
      });
    }

    const res = await axiosInstance.post<SendMassEmailResponse>(url, formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return res.data;
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<SendMassEmailResponse>;
      if (axiosError.response?.data) return axiosError.response.data;
    }

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
      data: null,
      errors: [error instanceof Error ? error.message : "Unknown error"],
      timestamp: Date.now(),
      path: url,
    };
  }
};

export default sendMassEmail;
