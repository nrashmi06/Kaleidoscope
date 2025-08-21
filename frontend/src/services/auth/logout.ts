import { AxiosError } from "axios";
import axiosInstance from "@/hooks/axios";
import { AuthMapper } from "@/mapper/authMapper";
import { isAxiosError } from "@/hooks/axios";
import { LogoutResponse } from "@/lib/types/auth"; 

export const logoutUser = async (
  accessToken: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axiosInstance.post<LogoutResponse>(
      AuthMapper.logout,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const { success, data, message, errors } = response.data;

    if (!success) {
      return {
        success: false,
        message: errors?.[0] || message || "Logout failed",
      };
    }

    return {
      success: true,
      message: typeof data === "string" ? data : message,
    };
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<LogoutResponse>;
      const errData = axiosError.response?.data;

      return {
        success: false,
        message: errData?.errors?.[0] || errData?.message || "Logout failed",
      };
    }

    return {
      success: false,
      message: "Unexpected error during logout",
    };
  }
};
