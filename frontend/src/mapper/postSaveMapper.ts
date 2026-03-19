const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api`;

export const PostSaveMapper = {
  getSaveStatus: (postId: number) => `${BASE_URL}/posts/${postId}/saves`,
  saveOrUnsave: (postId: number) => `${BASE_URL}/posts/${postId}/saves`,
  getSavedPosts: `${BASE_URL}/posts/saved`,
};
