import {
  getBlogSaveStatusService,
  toggleBlogSaveService,
  getSavedBlogsService,
} from "@/services/blog/blogSaveService";
import {
  BlogSaveStatusResponse,
  BlogSaveToggleResponse,
  GetSavedBlogsResponse,
} from "@/lib/types/blogSave";

export async function getBlogSaveStatusController(
  blogId: number,
  accessToken: string
): Promise<BlogSaveStatusResponse> {
  return getBlogSaveStatusService(blogId, accessToken);
}

export async function toggleBlogSaveController(
  blogId: number,
  accessToken: string
): Promise<BlogSaveToggleResponse> {
  return toggleBlogSaveService(blogId, accessToken);
}

export async function getSavedBlogsController(
  accessToken: string,
  page: number = 0,
  size: number = 10
): Promise<GetSavedBlogsResponse> {
  return getSavedBlogsService(accessToken, page, size);
}
