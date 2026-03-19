import { AxiosError } from "axios";
import axiosInstance, { isAxiosError } from "@/hooks/axios";
import { BlogCommentReactionMapper } from "@/mapper/blogCommentReactionMapper";
import { ReactionRequestBody, ReactionType, ReactionUpdateResponse } from "@/lib/types/reaction";

export async function reactToBlogCommentService(
  blogId: number,
  commentId: number,
  reactionType: ReactionType,
  unreact: boolean = false,
  accessToken: string
): Promise<ReactionUpdateResponse> {
  const endpoint = `${BlogCommentReactionMapper.postReactionForComment(blogId, commentId)}?unreact=${unreact}`;

  try {
    const response = await axiosInstance.post<ReactionUpdateResponse>(
      endpoint,
      { reactionType } satisfies ReactionRequestBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<ReactionUpdateResponse>;
      return axiosError.response?.data || {
        success: false,
        message: "Failed to react to blog comment",
        data: null,
        errors: [axiosError.message],
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error",
      data: null,
      errors: ["Unknown error"],
    };
  }
}
