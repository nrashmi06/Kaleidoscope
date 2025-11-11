const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api`;

export const PostMapper = {
  // Post endpoints
  createPost: `${BASE_URL}/posts`,
  generateUploadSignatures: `${BASE_URL}/posts/generate-upload-signatures`,
  updatePost: (postId: number) => `${BASE_URL}/posts/${postId}`,
  deletePost: (postId: number) => `${BASE_URL}/posts/${postId}`,
  hardDeletePost: (postId: number) => `${BASE_URL}/posts/${postId}/hard`,
  getPostById: (postId: number) => `${BASE_URL}/posts/${postId}`,
  filterPosts: `${BASE_URL}/posts`,

  // Location endpoints
  searchLocations: `${BASE_URL}/locations/search`,
  createLocation: `${BASE_URL}/locations`,

  // User endpoints for tagging
  getAllUsers: `${BASE_URL}/users`,
  searchUsers: `${BASE_URL}/users`,
} as const;
