// services/user_preferences/updatePrivacy.ts

import {
  UpdatePrivacySettingsData,
  UserPreferencesAPIResponse,
} from "@/lib/types/settings/user-preferences";
import { UserPreferencesMapper } from "@/mapper/user-preferences";
import axiosInstance from "@/hooks/axios";

export const updateUserPrivacy = async (
  payload: UpdatePrivacySettingsData
): Promise<UserPreferencesAPIResponse> => {
  const response = await axiosInstance.put(UserPreferencesMapper.updatePrivacy, payload);
  return response.data;
};
