// controllers/user_preferences/updateLanguageController.ts

import { AxiosError } from "axios";
import { updateLanguage } from "@/services/user_preferences/updateLanguage";
import {
  UpdateLanguageData,
  UserPreferencesAPIResponse,
} from "@/lib/types/settings/user-preferences";

export const updateLanguageController = async (
  payload: UpdateLanguageData
): Promise<UserPreferencesAPIResponse> => {
  try {
    const response = await updateLanguage(payload);
    return {
      ...response,
      path: "/api/user-preferences/language",
      timestamp: Date.now(),
    };
  } catch (error) {
    let message = "Failed to update language";
    if (error instanceof AxiosError) {
      message = error.response?.data?.message || message;
    }

    return {
      success: false,
      message,
      data: null,
      errors: [message],
      timestamp: Date.now(),
      path: "/api/user-preferences/language",
    };
  }
};
