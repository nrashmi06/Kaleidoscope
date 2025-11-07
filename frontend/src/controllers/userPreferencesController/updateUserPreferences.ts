/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-floating-promises */

import { AxiosError } from "axios";
import { updateUserPreferences } from "@/services/user_preferences/updateUserPreferences";
import {
  UpdateUserPreferencesData,
  UserPreferencesAPIResponse,
} from "@/lib/types/settings/user-preferences";

/**
 * 🧭 Controller: Update User Preferences
 *
 * - Removes unwanted fields before calling service layer
 * - Handles all Axios and unexpected errors
 * - Adds consistent response metadata
 */
export const updateUserPreferencesController = async (
  input: UpdateUserPreferencesData & Record<string, any>, // allow extra fields
  accessToken: string
): Promise<UserPreferencesAPIResponse> => {
  try {
    // 🧹 Clean unwanted backend-only fields
    const {
      preferenceId,
      userId,
      createdAt,
      updatedAt,
      ...cleanInput
    } = input;

    const response = await updateUserPreferences(
      cleanInput as UpdateUserPreferencesData,
      accessToken
    );

    return {
      ...response,
      timestamp: Date.now(),
      path: "/api/user-preferences",
    };
  } catch (error: any) {
    const message =
      error instanceof AxiosError
        ? error.response?.data?.message || "Failed to update user preferences"
        : "Failed to update user preferences";

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
