
import {
  UpdateUserPreferencesData,
  UserPreferencesAPIResponse,
} from "@/lib/types/settings/user-preferences";
import { UserPreferencesMapper } from "@/mapper/user-preferences";
import axiosInstance from "@/hooks/axios";

export const updateUserPreferences = async (
  payload: UpdateUserPreferencesData,
  accessToken: string
): Promise<UserPreferencesAPIResponse> => {
  const response = await axiosInstance.put(UserPreferencesMapper.updateUserPreferences, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  return response.data;
};
