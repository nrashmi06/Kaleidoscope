import { AxiosError } from "axios";
import { updateUserPreferences } from "@/services/user_preferences/updateUserPreferences";
import {
  UpdateUserPreferencesData,
  UserPreferencesAPIResponse,
} from "@/lib/types/settings/user-preferences";

export const updateUserPreferencesController = async (
  input: UpdateUserPreferencesData,
  accessToken: string
): Promise<UserPreferencesAPIResponse> => {
  try {
    const response = await updateUserPreferences(input, accessToken);

    return {
      ...response,
      timestamp: Date.now(),
      path: "/api/user-preferences",
    };
  } catch (error) {
    let message = "Failed to update user preferences";
    if (error instanceof AxiosError) {
      message = error.response?.data?.message || message;
    }

    return {
      success: false,
      message,
      data: null,
      errors: [message],
      timestamp: Date.now(),
      path: "/api/user-preferences",
    };
  }
};
