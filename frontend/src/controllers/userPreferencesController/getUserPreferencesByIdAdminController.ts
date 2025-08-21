import { AxiosError } from "axios";
import { fetchUserPreferencesByIdAdmin } from "@/services/user_preferences/getUserPreferencesByIdAdmin";
import {
  GetUserPreferencesByIdAdminData,
  UserPreferencesAPIResponse,
} from "@/lib/types/settings/user-preferences";

export const getUserPreferencesByIdAdminController = async (
  input: GetUserPreferencesByIdAdminData,
  accessToken: string
): Promise<UserPreferencesAPIResponse> => {
  try {
    const response = await fetchUserPreferencesByIdAdmin(input, accessToken);

    return {
      ...response,
      timestamp: Date.now(),
      path: "/api/user-preferences/admin",
    };
  } catch (error) {
    let message = "Failed to fetch user preferences";
    if (error instanceof AxiosError) {
      message = error.response?.data?.message || message;
    }

    return {
      success: false,
      message,
      data: null,
      errors: [message],
      timestamp: Date.now(),
      path: "/api/user-preferences/admin",
    };
  }
};
