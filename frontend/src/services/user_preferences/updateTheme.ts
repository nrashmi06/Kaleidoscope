import axios from "axios";
import {
  UpdateThemeData,
  UserPreferencesAPIResponse,
} from "@/lib/types/settings/user-preferences";
import { UserPreferencesMapper } from "@/mapper/user-preferences";

export const updateUserTheme = async (
  payload: UpdateThemeData
): Promise<UserPreferencesAPIResponse> => {
  const response = await axios.put(UserPreferencesMapper.updateTheme, payload);
  return response.data;
};
