import { ReactionRequestBody, ReactionUpdateResponse } from "@/lib/types/reaction";
import { PostReactionMapper } from "@/mapper/postReactionMapper";

/**
 * React or unreact to a post
 *
 * @param postId - ID of the post
 * @param reactionType - Type of reaction (LIKE, CELEBRATE, etc.)
 * @param unreact - Optional flag to remove existing reaction
 * @param accessToken - JWT token for authorization
 * @returns API response containing updated reaction summary
 */
export async function reactToPostService(
  postId: number,
  reactionType: string,
  unreact: boolean = false,
  accessToken: string
): Promise<ReactionUpdateResponse> {
  try {
    // Construct the endpoint using your mapper and unreact flag
    const endpoint = `${PostReactionMapper.postReactionForPost(postId)}?unreact=${unreact}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ reactionType } as ReactionRequestBody),
    });

    // Parse the JSON response
    const data = (await response.json()) as ReactionUpdateResponse;

    return data;
  } catch (error) {
    console.error("Error reacting to post:", error);
    return {
      success: false,
      message: "Failed to update reaction",
      data: null,
      errors: [String(error)],
    };
  }
}
