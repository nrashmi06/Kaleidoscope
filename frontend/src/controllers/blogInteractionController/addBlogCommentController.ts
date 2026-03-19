import { addBlogCommentService } from "@/services/blogInteractionService/addBlogCommentService";
import { AddCommentRequest, AddCommentResponse } from "@/lib/types/comment";

export async function addBlogCommentController(
  blogId: number,
  accessToken: string,
  payload: AddCommentRequest
): Promise<AddCommentResponse> {
  return addBlogCommentService(blogId, payload, accessToken);
}
