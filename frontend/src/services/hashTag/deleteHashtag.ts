import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";
import { HashtagMapper } from "@/mapper/hashtagMapper";

interface StandardResponse {
  success: boolean;
  message: string;
  data: unknown;
  errors: string[];
  timestamp: number;
  path: string;
}

export async function deleteHashtagService(
  hashtagId: number,
  accessToken: string
): Promise<StandardResponse> {
  const url = HashtagMapper.deleteHashtag(hashtagId);

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
        message: "Failed to delete hashtag",
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
