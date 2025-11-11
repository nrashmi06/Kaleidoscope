// services/user_preferences/updateLanguage.ts
import { axiosInstance } from "@/hooks/axios";
import {
  UpdateLanguageData,
  UserPreferencesAPIResponse,
} from "@/lib/types/settings/user-preferences";
import { UserPreferencesMapper } from "@/mapper/user-preferences";

export const updateLanguage = async (
  payload: UpdateLanguageData
): Promise<UserPreferencesAPIResponse> => {
  const response = await axiosInstance.patch(UserPreferencesMapper.updateLanguage, payload);
  return response.data; 
};
