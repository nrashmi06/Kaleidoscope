import axios, { AxiosError } from "axios";
import { AuthMapper } from "@/mapper/authMapper";

export const logoutUser = async (
  accessToken: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.post(
      AuthMapper.logout,
      {}, 
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      message: response.data.message,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message: string }>;
      const errData = axiosError.response?.data || { message: axiosError.message };
      return {
        success: false,
        message: typeof errData === "string" ? errData : errData.message || "Logout failed",
      };
    }

    return {
      success: false,
      message: "Unexpected error during logout",
    };
  }
};
