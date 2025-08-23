import axios, { AxiosError } from "axios";
import {
  ForgotPasswordData,
  ForgotPasswordResponse,
} from "@/lib/types/auth";
import { AuthMapper } from "@/mapper/authMapper";

export const forgotPassword = async (
  data: ForgotPasswordData
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.post<ForgotPasswordResponse>(
      AuthMapper.forgotPassword,
      data
    );

    const apiResponse = response.data;

    if (!apiResponse.success) {
      return {
        success: false,
        message: apiResponse.message || "Failed to send OTP",
      };
    }

    return {
      success: true,
      message: apiResponse.data.message || apiResponse.message,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ForgotPasswordResponse>;

      const errData = axiosError.response?.data;
      return {
        success: false,
        message:
          errData?.errors?.[0] || errData?.message || "Failed to send OTP",
      };
    }

    return {
      success: false,
      message: "Unexpected error occurred",
    };
  }
};
