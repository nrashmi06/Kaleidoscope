import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { SinglePostResponse } from '@/lib/types/post';
import axiosInstance from '@/hooks/axios';

/**
 * API Error class for handling different error scenarios
 */
export class PostApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: string[],
    public path?: string
  ) {
    super(message);
    this.name = 'PostApiError';
  }
}

/**
 * Axios instance for Post API requests
 */
const baseURL =
  process.env.NEXT_PUBLIC_BASE_BACKEND_URL || 'http://localhost:8080';

const postApi: AxiosInstance = axiosInstance.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: 10000,
});

/**
 * Fetches a single post by its ID from the backend API
 * @param postId - The unique identifier of the post
 * @param accessToken - JWT token for authorization
 * @returns Promise resolving to the post data
 * @throws PostApiError for various error scenarios
 */
export async function getPostById(
  postId: number,
  accessToken?: string
): Promise<SinglePostResponse> {
  const url = `/api/posts/${postId}`;

  try {
    const response: AxiosResponse<SinglePostResponse> = await postApi.get(url, {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    });

    // Validate response
    if (!response.data.success || !response.data.data) {
      throw new PostApiError(
        500,
        'Invalid response format from server',
        ['Response data is malformed'],
        url
      );
    }

    return response.data;
  } catch (error: unknown) {
    // Handle known Axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{
        success?: boolean;
        message?: string;
        errors?: string[];
        timestamp?: number;
        path?: string;
      }>;

      const status = axiosError.response?.status ?? 0;
      const data = axiosError.response?.data;

      const message =
        data?.message ||
        axiosError.message ||
        `Failed to fetch post with ID ${postId}`;
      const errors =
        data?.errors || [message];
      const path = data?.path || url;

      switch (status) {
        case 401:
          throw new PostApiError(401, 'Unauthorized access', errors, path);
        case 403:
          throw new PostApiError(403, 'Access denied to this post', errors, path);
        case 404:
          throw new PostApiError(404, 'Post not found', errors, path);
        case 0:
          throw new PostApiError(
            0,
            'Network error: Unable to connect to server',
            ['Please check your internet connection and try again'],
            path
          );
        default:
          throw new PostApiError(status, message, errors, path);
      }
    }

    // Handle non-Axios errors safely
    const fallbackMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new PostApiError(
      500,
      'An unexpected error occurred',
      [fallbackMessage],
      `/api/posts/${postId}`
    );
  }
}
