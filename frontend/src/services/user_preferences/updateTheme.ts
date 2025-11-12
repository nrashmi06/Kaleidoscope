
import {
  UpdateThemeData,
  UserPreferencesAPIResponse,
} from "@/lib/types/settings/user-preferences";
import { UserPreferencesMapper } from "@/mapper/user-preferences";
import axiosInstance from "@/hooks/axios";

export const updateUserTheme = async (
  payload: UpdateThemeData
): Promise<UserPreferencesAPIResponse> => {
  const response = await axiosInstance.put(UserPreferencesMapper.updateTheme, payload);
  return response.data;
};
