import axios from "axios";
import {
  UpdateUserPreferencesData,
  UserPreferencesAPIResponse,
} from "@/lib/types/settings/user-preferences";
import { UserPreferencesMapper } from "@/mapper/user-preferences";

export const updateUserPreferences = async (
  payload: UpdateUserPreferencesData,
  accessToken: string
): Promise<UserPreferencesAPIResponse> => {
  const response = await axios.put(UserPreferencesMapper.updateUserPreferences, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  return response.data;
};
