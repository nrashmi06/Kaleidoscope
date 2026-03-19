import { AxiosError } from "axios";
import axiosInstance, { isAxiosError } from "@/hooks/axios";
import { BLOG_ENDPOINTS } from "@/mapper/blogMapper";
import { BlogUpdateRequest, UpdateBlogResponse } from "@/lib/types/blogDetail";

export async function updateBlogService(
  accessToken: string,
  blogId: number,
  payload: BlogUpdateRequest
): Promise<UpdateBlogResponse> {
  const url = BLOG_ENDPOINTS.updateBlog(blogId);

  try {
    const response = await axiosInstance.put<UpdateBlogResponse>(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<UpdateBlogResponse>;
      return axiosError.response?.data || {
        success: false,
        message: `Failed to update blog ${blogId}`,
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
