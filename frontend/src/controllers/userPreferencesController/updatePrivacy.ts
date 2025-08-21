// controllers/userPreferencesController/updatePrivacy.ts

import { AxiosError } from "axios";
import { updateUserPrivacy } from "@/services/user_preferences/updatePrivacy";
import {
  UpdatePrivacySettingsData,
  UserPreferencesAPIResponse,
} from "@/lib/types/settings/user-preferences";

export const updateUserPrivacyController = async (
  input: UpdatePrivacySettingsData
): Promise<UserPreferencesAPIResponse> => {
  try {
    const response = await updateUserPrivacy(input);

    return {
      ...response,
      path: "/api/user-preferences/privacy",
      timestamp: Date.now(),
    };
  } catch (error) {
    let message = "Failed to update privacy settings";
    if (error instanceof AxiosError) {
      message = error.response?.data?.message || message;
    }

    return {
      success: false,
      message,
      data: null,
      errors: [message],
      timestamp: Date.now(),
      path: "/api/user-preferences/privacy",
    };
  }
};
