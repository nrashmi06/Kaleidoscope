import {
  getPostSaveStatusService,
  togglePostSaveService,
  getSavedPostsService,
} from "@/services/post/postSaveService";
import {
  PostSaveStatusResponse,
  PostSaveToggleResponse,
  GetSavedPostsResponse,
} from "@/lib/types/postSave";

export async function getPostSaveStatusController(
  postId: number,
  accessToken: string
): Promise<PostSaveStatusResponse> {
  return getPostSaveStatusService(postId, accessToken);
}

export async function togglePostSaveController(
  postId: number,
  accessToken: string
): Promise<PostSaveToggleResponse> {
  return togglePostSaveService(postId, accessToken);
}

export async function getSavedPostsController(
  accessToken: string,
  page: number = 0,
  size: number = 10
): Promise<GetSavedPostsResponse> {
  return getSavedPostsService(accessToken, page, size);
}
