import { AxiosError } from "axios";
import axiosInstance, { isAxiosError } from "@/hooks/axios";
import { BLOG_ENDPOINTS } from "@/mapper/blogMapper";
import { BlogTaggedByResponse } from "@/lib/types/blogDetail";

export async function getBlogTaggedByService(
  accessToken: string,
  blogId: number
): Promise<BlogTaggedByResponse> {
  const url = BLOG_ENDPOINTS.getTaggedBy(blogId);

  try {
    const response = await axiosInstance.get<BlogTaggedByResponse>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<BlogTaggedByResponse>;
      return axiosError.response?.data || {
        success: false,
        message: `Failed to fetch tagged-by for blog ${blogId}`,
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
