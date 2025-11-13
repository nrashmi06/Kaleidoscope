import axios, { AxiosError } from "axios";
import { RefreshTokenResponse } from "@/lib/types/auth";
import { AuthMapper } from "@/mapper/authMapper";
import { AppDispatch } from "@/store/index";
import { setUser } from "@/store/authSlice";

export const refreshToken =
  () => async (dispatch: AppDispatch): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await axios.post<RefreshTokenResponse>(
        AuthMapper.renewToken,
        {},
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      const { success, data, message, errors } = response.data;

      if (!success || !data?.accessToken) {
        return {
          success: false,
          message: errors?.[0] || message || "No access token returned from server.",
        };
      }

      dispatch(
        setUser({
          userId: Number(data.userId),
        username: data.username,
        email: data.email,
        role: data.role,
        accessToken: data.accessToken,
        profilePictureUrl: data.profilePictureUrl || "",
        isUserInterestSelected:  false,
        followingUserIds: [], 
        followersUserIds: [],
        pendingRequestUserIds: [],
        })
      );

      return {
        success: true,
        message: message || "Token refreshed successfully",
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<RefreshTokenResponse>;
        const errData = axiosError.response?.data;

        return {
          success: false,
          message: errData?.errors?.[0] || errData?.message || axiosError.message || "Token refresh failed",
        };
      }

      return {
        success: false,
        message: "Unexpected error occurred",
      };
    }
  };
