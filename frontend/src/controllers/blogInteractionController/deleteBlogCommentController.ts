import { deleteBlogCommentService } from "@/services/blogInteractionService/deleteBlogCommentService";
import { DeleteCommentResponse } from "@/lib/types/comment";

export async function deleteBlogCommentController(
  blogId: number,
  commentId: number,
  accessToken: string
): Promise<DeleteCommentResponse> {
  return deleteBlogCommentService(blogId, commentId, accessToken);
}
