// mapper/postCommentMapper.ts
const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/kaleidoscope/api`;

export const PostCommentMapper = {
  /**
   * Builds the API URL for fetching comments of a post.
   * Example: /api/posts/12/comments?page=0&size=10&sort=createdAt,desc
   */
  getCommentsForPost: (postId: number, page: number = 0, size: number = 10, sort: string = "createdAt,desc") =>
    `${BASE_URL}/posts/${postId}/comments?page=${page}&size=${size}&sort=${encodeURIComponent(sort)}`,
};
