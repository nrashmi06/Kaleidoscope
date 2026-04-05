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

export async function addBulkInterestsService(
  categoryIds: number[],
  accessToken: string
): Promise<StandardResponse> {
  const url = UserInterestMapper.addUserInterestsBulk;

  try {
    const response = await axiosInstance.post<StandardResponse>(
      url,
      { categoryIds },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<StandardResponse>;
      return axiosError.response?.data || {
        success: false,
        message: "Failed to add bulk interests",
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
