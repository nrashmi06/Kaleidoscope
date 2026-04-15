import { AxiosError } from "axios";
import { axiosInstance } from "@/hooks/axios";
import {
  BlogRequest,
  CreateBlogServiceResponse,
  BlogDataResponse,
} from "@/lib/types/createBlog";
import { BLOG_ENDPOINTS } from "@/mapper/blogMapper";

export async function createBlog(
  payload: BlogRequest,
  accessToken: string
): Promise<CreateBlogServiceResponse> {
  const url = BLOG_ENDPOINTS.CREATE;

  try {
    const response = await axiosInstance.post<CreateBlogServiceResponse>(
      url,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;

  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return error.response.data as CreateBlogServiceResponse;
    }

    const message = error instanceof Error ? error.message : "Unexpected network error";

    return {
      success: false,
      message,
      data: {} as BlogDataResponse,
      errors: [message],
      timestamp: Date.now(),
      path: url,
    };
  }
}
