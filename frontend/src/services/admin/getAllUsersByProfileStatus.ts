import axiosInstance, { isAxiosError, AxiosError } from "@/hooks/axios";
import { UserMapper } from "@/mapper/userMapper";

interface StandardResponse {
  success: boolean;
  message: string;
  data: unknown;
  errors: string[];
  timestamp: number;
  path: string;
}

export const getAllUsersByProfileStatus = async (
  search: string,
  status: string,
  page: number,
  size: number,
  accessToken: string
): Promise<StandardResponse> => {
  const url = UserMapper.getAllUsersByProfileStatus(search, status, page, size);

  try {
    const res = await axiosInstance.get<StandardResponse>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
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

export default getAllUsersByProfileStatus;
