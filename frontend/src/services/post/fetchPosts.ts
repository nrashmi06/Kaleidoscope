import axiosInstance from "@/hooks/axios";
import axios, { AxiosError } from "axios";

export interface Post {
  postId: number;
  title: string;
  body?: string;
  summary: string;
  visibility: "PUBLIC" | "FOLLOWERS";
  createdAt: string;
  updatedAt?: string;
  author: {
    userId: number;
    username: string;
    profilePictureUrl?: string;
  };
  location?: {
    locationId: number;
    name: string;
    city: string;
    country: string;
  };
  categories: Array<{
    categoryId: number;
    name: string;
  }>;
  mediaDetails?: Array<{
    url: string;
    mediaType: "IMAGE" | "VIDEO";
    position: number;
    width: number;
    height: number;
    fileSizeKb: number;
    durationSeconds?: number | null;
    extraMetadata?: Record<string, unknown>;
  }>;
  taggedUsers?: Array<{
    userId: number;
    username: string;
  }>;
  thumbnailUrl?: string;
  likeCount?: number;
  commentCount: number;
  reactionCount?: number;
  shareCount?: number;
  isLikedByCurrentUser?: boolean;
}

export interface FetchPostsResponse {
  success: boolean;
  message: string;
  data: {
    content: Post[];
    totalElements: number;
    page: number;
    size: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  errors: unknown[];
  timestamp: number;
  path: string;
}

/** Define a strict type for Axios error response shape */
interface ApiErrorResponse {
  message?: string;
  status?: number;
  timestamp?: string | number;
  path?: string;
}

/** Strict return type */
interface FetchPostsResult {
  success: boolean;
  data?: FetchPostsResponse;
  error?: string;
}

export const fetchPostsService = async (
  accessToken: string,
  options?: {
    page?: number;
    size?: number;
    sort?: string;
    sortBy?: string;
    sortDirection?: "ASC" | "DESC";
  }
): Promise<FetchPostsResult> => {
  try {
    const params = new URLSearchParams();

    if (options?.page !== undefined) params.append("page", options.page.toString());
    if (options?.size !== undefined) params.append("size", options.size.toString());

    // Handle sort logic
    if (options?.sort) {
      params.append("sort", options.sort);
    } else if (options?.sortBy && options?.sortDirection) {
      params.append("sort", `${options.sortBy},${options.sortDirection.toLowerCase()}`);
    } else if (options?.sortBy) {
      params.append("sort", `${options.sortBy},desc`);
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_BACKEND_URL ?? "";
    const url = `${baseUrl}/api/posts`;

    console.log("Fetching posts from:", `${url}?${params.toString()}`);

    const response = await axiosInstance.get<FetchPostsResponse>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params,
    });

    console.log("Posts fetch response:", response.data);

    if (!response.data.success) {
      return {
        success: false,
        error: response.data.message || "Backend returned unsuccessful response",
      };
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error: unknown) {
    // Ensure `error` is narrowed to AxiosError<ApiErrorResponse>
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message =
        axiosError.response?.data?.message ??
        axiosError.message ??
        "Unknown API error";

      console.error("Axios error response:", axiosError.response?.data);

      return {
        success: false,
        error: message,
      };
    }

    // Fallback for unexpected errors (non-Axios)
    const genericError =
      error instanceof Error ? error.message : "Unknown network error";
    console.error("Unexpected error fetching posts:", error);

    return {
      success: false,
      error: genericError,
    };
  }
};
