
import {
  UpdateVisibilitySettingsData,
  UserPreferencesAPIResponse,
} from "@/lib/types/settings/user-preferences";
import { UserPreferencesMapper } from "@/mapper/user-preferences";
import axiosInstance from "@/hooks/axios";

export const updateUserVisibility = async (
  payload: UpdateVisibilitySettingsData
): Promise<UserPreferencesAPIResponse> => {
  const response = await axiosInstance.put(UserPreferencesMapper.updateVisibility, payload);
  return response.data;
};
