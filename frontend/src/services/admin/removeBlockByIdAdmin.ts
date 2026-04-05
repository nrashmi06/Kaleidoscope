import axiosInstance, { isAxiosError, AxiosError } from "@/hooks/axios";
import { UserBlocksMapper } from "@/mapper/user-blocksMapper";

interface RemoveBlockApiResponse {
  success: boolean;
  message: string;
  data: unknown;
  errors: string[];
  timestamp: number;
  path: string;
}

export type { RemoveBlockApiResponse };

export const removeBlockByIdAdmin = async (
  id: string,
  accessToken: string
): Promise<RemoveBlockApiResponse> => {
  const url = UserBlocksMapper.removeBlockByIdAdmin(id);

  try {
    const response = await axiosInstance.delete<RemoveBlockApiResponse>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<RemoveBlockApiResponse>;
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
