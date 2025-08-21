import { AxiosError } from "axios";
import { updateUserTheme } from "@/services/user_preferences/updateTheme";
import {
  UpdateThemeData,
  UserPreferencesAPIResponse,
} from "@/lib/types/settings/user-preferences";

export const updateUserThemeController = async (
  input: UpdateThemeData
): Promise<UserPreferencesAPIResponse> => {
  try {
    const response = await updateUserTheme(input);

    return {
      ...response,
      timestamp: Date.now(),
      path: "/api/user-preferences/theme",
    };
  } catch (error) {
    let message = "Failed to update theme";
    if (error instanceof AxiosError) {
      message = error.response?.data?.message || message;
    }

    return {
      success: false,
      message,
      data: null,
      errors: [message],
      timestamp: Date.now(),
      path: "/api/user-preferences/theme",
    };
  }
};
