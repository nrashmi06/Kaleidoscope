// services/user_preferences/updatePrivacy.ts

import axios from "axios";
import {
  UpdatePrivacySettingsData,
  UserPreferencesAPIResponse,
} from "@/lib/types/settings/user-preferences";
import { UserPreferencesMapper } from "@/mapper/user-preferences";

export const updateUserPrivacy = async (
  payload: UpdatePrivacySettingsData
): Promise<UserPreferencesAPIResponse> => {
  const response = await axios.put(UserPreferencesMapper.updatePrivacy, payload);
  return response.data;
};
