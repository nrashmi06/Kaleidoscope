import { getCommentsForBlogService } from "@/services/blogInteractionService/getCommentsForBlogService";
import { CommentsListResponse } from "@/lib/types/comment";

export async function getCommentsForBlogController(
  blogId: number,
  accessToken: string,
  page: number = 0,
  size: number = 5,
  sort: string = "createdAt,desc"
): Promise<CommentsListResponse> {
  return getCommentsForBlogService(blogId, page, size, sort, accessToken);
}
