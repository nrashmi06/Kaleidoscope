// services/user_preferences/updateLanguage.ts

import axios from "axios";
import {
  UpdateLanguageData,
  UserPreferencesAPIResponse,
} from "@/lib/types/settings/user-preferences";
import { UserPreferencesMapper } from "@/mapper/user-preferences";

export const updateLanguage = async (
  payload: UpdateLanguageData
): Promise<UserPreferencesAPIResponse> => {
  const response = await axios.patch(UserPreferencesMapper.updateLanguage, payload);
  return response.data; 
};
