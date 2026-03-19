import { AxiosError } from "axios";
import axiosInstance, { isAxiosError } from "@/hooks/axios";
import { BLOG_ENDPOINTS } from "@/mapper/blogMapper";
import { GetBlogByIdResponse } from "@/lib/types/blogDetail";

export async function getBlogByIdService(
  accessToken: string,
  blogId: number
): Promise<GetBlogByIdResponse> {
  const url = BLOG_ENDPOINTS.getBlogById(blogId);

  try {
    const response = await axiosInstance.get<GetBlogByIdResponse>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<GetBlogByIdResponse>;
      return axiosError.response?.data || {
        success: false,
        message: `Failed to fetch blog ${blogId}`,
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
