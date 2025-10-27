// controllers/postInteractionController/getCommentsForPostController.ts

import { getCommentsForPostService } from "@/services/postInteractionService/getCommentsForPostService";
import { CommentsListResponse } from "@/lib/types/comment";

/**
 * Controller to fetch paginated comments for a post.
 * Handles request coordination and business logic (if any).
 */
export const getCommentsForPostController = async (
  postId: number,
  accessToken: string,
  page: number = 0,
  size: number = 10,
  sort: string = "createdAt,desc"
): Promise<CommentsListResponse> => {
  const response = await getCommentsForPostService(postId, page, size, sort, accessToken);
  return response;
};
