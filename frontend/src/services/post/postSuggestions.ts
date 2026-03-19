import { AxiosError } from "axios";
import axiosInstance, { isAxiosError } from "@/hooks/axios";
import { PostMapper } from "@/mapper/postMapper";

interface PostSuggestionsResponse {
  success: boolean;
  message: string;
  data: unknown;
  errors?: string[];
  timestamp: number;
  path: string;
}

export async function getPostSuggestionsService(
  accessToken: string,
  page: number = 0,
  size: number = 10
): Promise<PostSuggestionsResponse> {
  const url = PostMapper.suggestions;

  try {
    const response = await axiosInstance.get<PostSuggestionsResponse>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { page, size },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<PostSuggestionsResponse>;
      return axiosError.response?.data || {
        success: false,
        message: "Failed to fetch post suggestions",
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
