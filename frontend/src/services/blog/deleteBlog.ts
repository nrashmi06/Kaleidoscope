import { AxiosError } from "axios";
import axiosInstance, { isAxiosError } from "@/hooks/axios";
import { BLOG_ENDPOINTS } from "@/mapper/blogMapper";
import { DeleteBlogResponse } from "@/lib/types/blogDetail";

export async function deleteBlogService(
  accessToken: string,
  blogId: number
): Promise<DeleteBlogResponse> {
  const url = BLOG_ENDPOINTS.deleteBlog(blogId);

  try {
    const response = await axiosInstance.delete<DeleteBlogResponse>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<DeleteBlogResponse>;
      return axiosError.response?.data || {
        success: false,
        message: `Failed to delete blog ${blogId}`,
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
