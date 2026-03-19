import { AxiosError } from "axios";
import axiosInstance, { isAxiosError } from "@/hooks/axios";
import { BLOG_ENDPOINTS } from "@/mapper/blogMapper";
import {
  BlogSaveStatusResponse,
  BlogSaveToggleResponse,
  GetSavedBlogsResponse,
} from "@/lib/types/blogSave";

export async function getBlogSaveStatusService(
  blogId: number,
  accessToken: string
): Promise<BlogSaveStatusResponse> {
  const url = BLOG_ENDPOINTS.getSaveStatus(blogId);

  try {
    const response = await axiosInstance.get<BlogSaveStatusResponse>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<BlogSaveStatusResponse>;
      return axiosError.response?.data || {
        success: false,
        message: "Failed to get blog save status",
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

export async function toggleBlogSaveService(
  blogId: number,
  accessToken: string
): Promise<BlogSaveToggleResponse> {
  const url = BLOG_ENDPOINTS.saveOrUnsave(blogId);

  try {
    const response = await axiosInstance.post<BlogSaveToggleResponse>(url, null, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<BlogSaveToggleResponse>;
      return axiosError.response?.data || {
        success: false,
        message: "Failed to toggle blog save",
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

export async function getSavedBlogsService(
  accessToken: string,
  page: number = 0,
  size: number = 10
): Promise<GetSavedBlogsResponse> {
  const url = BLOG_ENDPOINTS.SAVED;

  try {
    const response = await axiosInstance.get<GetSavedBlogsResponse>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { page, size },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<GetSavedBlogsResponse>;
      return axiosError.response?.data || {
        success: false,
        message: "Failed to fetch saved blogs",
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
