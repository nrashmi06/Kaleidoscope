import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";
import { UserInterestMapper } from "@/mapper/userInterestMapper";

interface StandardResponse {
  success: boolean;
  message: string;
  data: unknown;
  errors: string[];
  timestamp: number;
  path: string;
}

export async function getCategoryAnalyticsService(
  accessToken: string,
  page?: number,
  size?: number
): Promise<StandardResponse> {
  const url = UserInterestMapper.getCategoryAnalytics;

  try {
    const response = await axiosInstance.get<StandardResponse>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { page, size },
    });
    return response.data;
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<StandardResponse>;
      return axiosError.response?.data || {
        success: false,
        message: "Failed to fetch category analytics",
        data: null,
        errors: [axiosError.message],
        timestamp: Date.now(),
        path: url,
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error",
      data: null,
      errors: ["Unknown error"],
      timestamp: Date.now(),
      path: url,
    };
  }
}
