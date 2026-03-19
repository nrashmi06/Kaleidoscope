import { reactToBlogCommentService } from "@/services/blogInteractionService/reactToBlogCommentService";
import { ReactionType, ReactionUpdateResponse } from "@/lib/types/reaction";

export async function reactToBlogCommentController(
  blogId: number,
  commentId: number,
  reactionType: ReactionType,
  unreact: boolean,
  accessToken: string
): Promise<ReactionUpdateResponse> {
  return reactToBlogCommentService(blogId, commentId, reactionType, unreact, accessToken);
}
