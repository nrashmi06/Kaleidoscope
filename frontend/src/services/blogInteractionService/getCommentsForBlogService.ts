import { AxiosError } from "axios";
import axiosInstance, { isAxiosError } from "@/hooks/axios";
import { BlogCommentMapper } from "@/mapper/blogCommentMapper";
import { CommentsListResponse } from "@/lib/types/comment";

export const getCommentsForBlogService = async (
  blogId: number,
  page: number = 0,
  size: number = 10,
  sort: string = "createdAt,desc",
  accessToken: string
): Promise<CommentsListResponse> => {
  try {
    const response = await axiosInstance.get<CommentsListResponse>(
      BlogCommentMapper.getCommentsForBlog(blogId, page, size, sort),
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<CommentsListResponse>;
      return axiosError.response?.data || {
        success: false,
        message: "Failed to fetch blog comments",
        errors: [axiosError.message],
        data: null,
        timestamp: Date.now(),
        path: `/api/blogs/${blogId}/comments`,
      };
    }
    return {
      success: false,
      message: "Unexpected error fetching blog comments",
      errors: ["Unknown error"],
      data: null,
      timestamp: Date.now(),
      path: `/api/blogs/${blogId}/comments`,
    };
  }
};
