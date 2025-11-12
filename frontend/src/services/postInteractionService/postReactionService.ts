import axios,  { AxiosError } from "axios";
import axiosInstance from "@/hooks/axios";
import { ReactionRequestBody, ReactionType, ReactionUpdateResponse } from "@/lib/types/reaction";
import { PostReactionMapper } from "@/mapper/postReactionMapper";

/** Shape of backend error response for safe Axios narrowing */
interface ApiErrorResponse {
  message?: string;
  status?: number;
  timestamp?: string | number;
  path?: string;
  errors?: string[];
}

/**
 * React or unreact to a post.
 *
 * @param postId - ID of the post
 * @param reactionType - Type of reaction (e.g. "LIKE", "CELEBRATE", etc.)
 * @param unreact - Optional flag to remove an existing reaction
 * @param accessToken - JWT token for authorization
 * @returns API response containing updated reaction summary
 */
export async function reactToPostService(
  postId: number,
  reactionType: ReactionType,
  unreact: boolean = false,
  accessToken: string
): Promise<ReactionUpdateResponse> {
  const endpoint = `${PostReactionMapper.postReactionForPost(postId)}?unreact=${unreact}`;

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
  } catch (error: unknown) {
    console.error("❌ [reactToPostService] Error:", error);

    // ✅ Safely narrow Axios error type
    if (axios.isAxiosError?.(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message =
        axiosError.response?.data?.message ??
        axiosError.message ??
        "Unknown API error";

      return {
        success: false,
        message,
        data: null,
        errors: axiosError.response?.data?.errors ?? [],
      };
    }

    // ✅ Handle unexpected (non-Axios) errors
    const fallbackMessage =
      error instanceof Error ? error.message : "Unexpected network error";

    return {
      success: false,
      message: fallbackMessage,
      data: null,
      errors: [fallbackMessage],
    };
  }
}
