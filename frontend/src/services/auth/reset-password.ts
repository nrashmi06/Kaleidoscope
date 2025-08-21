import axios, { AxiosError } from "axios";
import { ResetPasswordData, ResetPasswordResponse } from "@/lib/types/auth";
import { AuthMapper } from "@/mapper/authMapper";

export const resetPassword = async (
  data: ResetPasswordData
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.post<ResetPasswordResponse>(
      AuthMapper.resetPassword,
      data
    );

    return {
      success: response.data.success,
      message: response.data.message
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ResetPasswordResponse>;
      const errData = axiosError.response?.data;

      return {
        success: false,
        message: errData?.message || "Failed to reset password"
      };
    }

    return {
      success: false,
      message: "Unexpected error occurred"
    };
  }
};
