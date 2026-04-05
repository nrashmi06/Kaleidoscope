import axiosInstance, { isAxiosError, AxiosError } from "@/hooks/axios";
import { AdminMapper } from "@/mapper/adminMapper";

interface SendMassEmailRequest {
  subject: string;
  body: string;
  recipientFilter?: string;
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
    const res = await axiosInstance.post<SendMassEmailResponse>(url, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
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
