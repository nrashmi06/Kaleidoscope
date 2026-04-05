import axiosInstance, { isAxiosError, AxiosError } from "@/hooks/axios";
import { UserMapper } from "@/mapper/userMapper";

interface UpdateProfileStatusRequest {
  userId: number;
  status: string;
}

interface StandardResponse {
  success: boolean;
  message: string;
  data: unknown;
  errors: string[];
  timestamp: number;
  path: string;
}

export const updateUserProfileStatus = async (
  data: UpdateProfileStatusRequest,
  accessToken: string
): Promise<StandardResponse> => {
  const url = UserMapper.updateUserProfileStatusAdmin;

  try {
    const res = await axiosInstance.patch<StandardResponse>(url, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return res.data;
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<StandardResponse>;
      if (axiosError.response?.data) return axiosError.response.data;
    }

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
      data: null,
      errors: [error instanceof Error ? error.message : "Unknown error"],
      timestamp: Date.now(),
      path: url,
    };
  }
};

export default updateUserProfileStatus;
