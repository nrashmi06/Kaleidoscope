import axios from "axios";
import {
  GetUserPreferencesByIdAdminData,
  UserPreferencesAPIResponse,
} from "@/lib/types/settings/user-preferences";
import { UserPreferencesMapper } from "@/mapper/user-preferences";

export const fetchUserPreferencesByIdAdmin = async (
  input: GetUserPreferencesByIdAdminData,
  accessToken: string
): Promise<UserPreferencesAPIResponse> => {
  const response = await axios.get<UserPreferencesAPIResponse>(
    UserPreferencesMapper.getUserPreferencesByIdAdmin(input.userId),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data;
};
