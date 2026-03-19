import { AxiosError } from "axios";
import axiosInstance, { isAxiosError } from "@/hooks/axios";
import { PostSaveMapper } from "@/mapper/postSaveMapper";
import {
  PostSaveStatusResponse,
  PostSaveToggleResponse,
  GetSavedPostsResponse,
} from "@/lib/types/postSave";

export async function getPostSaveStatusService(
  postId: number,
  accessToken: string
): Promise<PostSaveStatusResponse> {
  const url = PostSaveMapper.getSaveStatus(postId);

  try {
    const response = await axiosInstance.get<PostSaveStatusResponse>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<PostSaveStatusResponse>;
      return axiosError.response?.data || {
        success: false,
        message: "Failed to get post save status",
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

export async function togglePostSaveService(
  postId: number,
  accessToken: string
): Promise<PostSaveToggleResponse> {
  const url = PostSaveMapper.saveOrUnsave(postId);

  try {
    const response = await axiosInstance.post<PostSaveToggleResponse>(url, null, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<PostSaveToggleResponse>;
      return axiosError.response?.data || {
        success: false,
        message: "Failed to toggle post save",
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

export async function getSavedPostsService(
  accessToken: string,
  page: number = 0,
  size: number = 10
): Promise<GetSavedPostsResponse> {
  const url = PostSaveMapper.getSavedPosts;

  try {
    const response = await axiosInstance.get<GetSavedPostsResponse>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { page, size },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<GetSavedPostsResponse>;
      return axiosError.response?.data || {
        success: false,
        message: "Failed to fetch saved posts",
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
