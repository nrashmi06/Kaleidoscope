import { AxiosError } from "axios";
import axiosInstance, { isAxiosError } from "@/hooks/axios";
import { BlogReactionMapper } from "@/mapper/blogReactionMapper";
import { ReactionRequestBody, ReactionType, ReactionUpdateResponse } from "@/lib/types/reaction";

export async function reactToBlogService(
  blogId: number,
  reactionType: ReactionType,
  unreact: boolean = false,
  accessToken: string
): Promise<ReactionUpdateResponse> {
  const endpoint = `${BlogReactionMapper.postReactionForBlog(blogId)}?unreact=${unreact}`;

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
        message: "Failed to react to blog",
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
