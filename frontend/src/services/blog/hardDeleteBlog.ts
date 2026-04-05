import { AxiosError } from "axios";
import axiosInstance, { isAxiosError } from "@/hooks/axios";
import { BLOG_ENDPOINTS } from "@/mapper/blogMapper";

interface StandardResponse {
  success: boolean;
  message: string;
  data: unknown;
  errors: string[];
  timestamp: number;
  path: string;
}

export async function hardDeleteBlogService(
  blogId: number,
  accessToken: string
): Promise<StandardResponse> {
  const url = BLOG_ENDPOINTS.hardDeleteBlog(blogId);

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
        message: `Failed to hard delete blog ${blogId}`,
        data: null,
        errors: [axiosError.message],
        timestamp: Date.now(),
        path: url,
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      data: null,
      errors: ["Unknown error"],
      timestamp: Date.now(),
      path: url,
    };
  }
}
