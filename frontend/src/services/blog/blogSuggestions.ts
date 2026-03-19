import { AxiosError } from "axios";
import axiosInstance, { isAxiosError } from "@/hooks/axios";
import { BLOG_ENDPOINTS } from "@/mapper/blogMapper";
import { BlogFilterResponse } from "@/lib/types/blogFilter.types";

export async function getBlogSuggestionsService(
  accessToken: string,
  page: number = 0,
  size: number = 10
): Promise<BlogFilterResponse> {
  const url = BLOG_ENDPOINTS.SUGGESTIONS;

  try {
    const response = await axiosInstance.get<BlogFilterResponse>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { page, size },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<BlogFilterResponse>;
      return axiosError.response?.data || {
        success: false,
        message: "Failed to fetch blog suggestions",
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
