import axiosInstance, { isAxiosError, AxiosError } from "@/hooks/axios";
import { AuthMapper } from "@/mapper/authMapper";

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  success: boolean;
  message: string;
  data: unknown;
  errors: string[];
  timestamp: number;
  path: string;
}

export const changePassword = async (
  data: ChangePasswordRequest,
  accessToken: string
): Promise<ChangePasswordResponse> => {
  const url = AuthMapper.changePassword;

  try {
    const res = await axiosInstance.put<ChangePasswordResponse>(url, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return res.data;
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<ChangePasswordResponse>;
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

export default changePassword;
