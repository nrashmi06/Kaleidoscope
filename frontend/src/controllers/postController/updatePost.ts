import { AxiosError } from "axios";
import { PostCreateRequestDTO, StandardAPIResponse } from "@/lib/types/post";
import { updatePost } from "@/services/post/updatePost";

export const updatePostController = async (
  postId: number,
  input: PostCreateRequestDTO,
  accessToken: string
): Promise<StandardAPIResponse<any>> => {
  try {
    const response = await updatePost(postId, input, accessToken);
    return response;
  } catch (error) {
    let errorMessage = "An unknown error occurred while updating the post.";

    if (error instanceof AxiosError) {
      errorMessage = error.response?.data?.message || error.message;
      console.error(
        `[PostController] Failed to update post - AxiosError: ${errorMessage}`
      );
    } else {
      console.error(
        `[PostController] Unexpected error while updating post:`,
        error
      );
    }

    return {
      success: false,
      message: "Failed to update post.",
      data: null,
      errors: [errorMessage],
      timestamp: Date.now(),
      path: "",
    };
  }
};
