import { getBlogCommentReactionsService } from "@/services/blogInteractionService/getBlogCommentReactionsService";
import { ReactionSummaryResponse } from "@/lib/types/reaction";

export async function getBlogCommentReactionsController(
  blogId: number,
  commentId: number,
  accessToken: string
): Promise<ReactionSummaryResponse> {
  return getBlogCommentReactionsService(blogId, commentId, accessToken);
}
