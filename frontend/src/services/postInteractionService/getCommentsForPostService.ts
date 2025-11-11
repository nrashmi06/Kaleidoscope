import axios, { AxiosError } from "axios";
import { PostCommentMapper } from "@/mapper/postCommentMapper";
import { CommentsListResponse } from "@/lib/types/comment";
import axiosInstance from "@/hooks/axios";

/**
 * Fetch comments for a given post
 * 
 * @param postId - The ID of the post
 * @param page - Page number for pagination (default 0)
 * @param size - Number of items per page (default 10)
 * @param accessToken - JWT access token for authorization
 * @returns List of comments and pagination metadata
 */
export const getCommentsForPostService = async (
  postId: number,
  page: number = 0,
  size: number = 10,
  sort: string = "createdAt,desc",
  accessToken: string
): Promise<CommentsListResponse> => {
  try {
    const response = await axiosInstance.get<CommentsListResponse>(
      PostCommentMapper.getCommentsForPost(postId, page, size, sort),
      {
        params: { page, size },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("[getCommentsForPost] Error:", error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<CommentsListResponse>;
      return (
        axiosError.response?.data || {
          success: false,
          message: "Failed to fetch comments",
          errors: [axiosError.message],
          data: null,
          timestamp: Date.now(),
          path: `/api/posts/${postId}/comments`,
        }
      );
    }

    // Fallback for unexpected errors
    return {
      success: false,
      message: "Unexpected error fetching post comments",
      errors: ["Unknown error"],
      data: null,
      timestamp: Date.now(),
      path: `/api/posts/${postId}/comments`,
    };
  }
};
