import { AxiosError } from "axios";
import { PostCreateRequestDTO, CreatePostResponse } from "@/lib/types/post";
import { createPost } from "@/services/post/createPost";

export const createPostController = async (
  input: PostCreateRequestDTO,
  accessToken: string
): Promise<CreatePostResponse> => {
  try {
    const response = await createPost(input, accessToken);
    return response;
  } catch (error) {
    let errorMessage = "An unknown error occurred while creating the post.";

    if (error instanceof AxiosError) {
      errorMessage = error.response?.data?.message || error.message;
      console.error(
        `[PostController] Failed to create post - AxiosError: ${errorMessage}`
      );
    } else {
      console.error(
        `[PostController] Unexpected error while creating post:`,
        error
      );
    }

    return {
      success: false,
      message: "Failed to create post.",
      data: null,
      errors: [errorMessage],
      timestamp: Date.now(),
      path: "/api/posts",
    };
  }
};
