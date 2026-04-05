import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";
import { PostMapper } from "@/mapper/postMapper";

interface StandardResponse {
  success: boolean;
  message: string;
  data: unknown;
  errors: string[];
  timestamp: number;
  path: string;
}

export async function deleteLocationService(
  locationId: number,
  accessToken: string
): Promise<StandardResponse> {
  const url = PostMapper.deleteLocation(locationId);

  try {
    const response = await axiosInstance.delete<StandardResponse>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<StandardResponse>;
      return axiosError.response?.data || {
        success: false,
        message: "Failed to delete location",
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
