import { getBlogReactionService } from "@/services/blogInteractionService/getBlogReactionService";
import { ReactionSummaryResponse } from "@/lib/types/reaction";

export async function getBlogReactionController(
  blogId: number,
  accessToken: string
): Promise<ReactionSummaryResponse> {
  return getBlogReactionService(blogId, accessToken);
}
