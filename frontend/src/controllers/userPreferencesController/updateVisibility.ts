import { AxiosError } from "axios";
import { updateUserVisibility } from "@/services/user_preferences/updateVisibility";
import {
  UpdateVisibilitySettingsData,
  UserPreferencesAPIResponse,
} from "@/lib/types/settings/user-preferences";

export const updateUserVisibilityController = async (
  input: UpdateVisibilitySettingsData
): Promise<UserPreferencesAPIResponse> => {
  try {
    const response = await updateUserVisibility(input);

    return {
      ...response,
      timestamp: Date.now(),
      path: "/api/user-preferences/visibility",
    };
  } catch (error) {
    let message = "Failed to update visibility settings";
    if (error instanceof AxiosError) {
      message = error.response?.data?.message || message;
    }

    return {
      success: false,
      message,
      data: null,
      errors: [message],
      timestamp: Date.now(),
      path: "/api/user-preferences/visibility",
    };
  }
};
