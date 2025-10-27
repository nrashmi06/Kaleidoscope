import { reactToPostService } from "@/services/postInteractionService/postReactionService";
import { ReactionUpdateResponse, ReactionType } from "@/lib/types/reaction";

/**
 * Controller: React or Unreact to a Post
 *
 * This function acts as a middle layer between your UI and service.
 * It manages input validation, error handling, and response formatting.
 *
 * @param postId - ID of the post
 * @param reactionType - Type of reaction (LIKE, CELEBRATE, etc.)
 * @param unreact - Optional flag (true = remove reaction)
 * @param accessToken - JWT token for authorization
 * @returns API response with updated reaction summary
 */
export async function reactToPostController(
  postId: number,
  reactionType: ReactionType,
  unreact: boolean = false,
  accessToken: string
): Promise<ReactionUpdateResponse> {
  if (!accessToken) {
    return {
      success: false,
      message: "Access token missing. Please log in again.",
      data: null,
      errors: ["Unauthorized access"],
    };
  }

  if (!postId || !reactionType) {
    return {
      success: false,
      message: "Invalid input. Post ID and reaction type are required.",
      data: null,
      errors: ["Invalid parameters"],
    };
  }

  try {
    const response = await reactToPostService(postId, reactionType, unreact, accessToken);

    // Optionally, you can perform custom handling here
    if (!response.success) {
      console.warn("Reaction update failed:", response.message);
    }

    return response;
  } catch (error) {
    console.error("Controller error reacting to post:", error);
    return {
      success: false,
      message: "Something went wrong while updating the reaction.",
      data: null,
      errors: [String(error)],
    };
  }
}
