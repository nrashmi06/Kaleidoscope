import { reactToBlogService } from "@/services/blogInteractionService/reactToBlogService";
import { ReactionType, ReactionUpdateResponse } from "@/lib/types/reaction";

export async function reactToBlogController(
  blogId: number,
  reactionType: ReactionType,
  unreact: boolean,
  accessToken: string
): Promise<ReactionUpdateResponse> {
  return reactToBlogService(blogId, reactionType, unreact, accessToken);
}
