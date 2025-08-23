import axios from "axios";
import {
  UpdateVisibilitySettingsData,
  UserPreferencesAPIResponse,
} from "@/lib/types/settings/user-preferences";
import { UserPreferencesMapper } from "@/mapper/user-preferences";

export const updateUserVisibility = async (
  payload: UpdateVisibilitySettingsData
): Promise<UserPreferencesAPIResponse> => {
  const response = await axios.put(UserPreferencesMapper.updateVisibility, payload);
  return response.data;
};
