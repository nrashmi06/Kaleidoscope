import axios, { AxiosError } from "axios";
import { RefreshResponseData } from "@/lib/types/auth";
import { AuthMapper } from "@/mapper/authMapper";
import { AppDispatch } from "@/store/index";
import { setUser } from "@/store/authSlice";

export const refreshToken =
  () => async (dispatch: AppDispatch): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await axios.post<RefreshResponseData>(
        AuthMapper.renewToken,
        {},
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      const { accessToken, userId, email, username, role } = response.data;

      if (!accessToken) {
        return {
          success: false,
          message: "No access token returned from server.",
        };
      }

      dispatch(
        setUser({
          accessToken,
          userId,
          email,
          username,
          role,
        })
      );

      return {
        success: true,
        message: response.statusText || "Token refreshed successfully",
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message: string }>;
        const errData = axiosError.response?.data || { message: axiosError.message };
        return {
          success: false,
          message: typeof errData === "string" ? errData : errData.message || "Failed to refresh token",
        };
      }

      return {
        success: false,
        message: "Unexpected error occurred",
      };
    }
  };
