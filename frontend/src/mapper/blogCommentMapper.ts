const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api`;

export const BlogCommentMapper = {
  getCommentsForBlog: (blogId: number, page: number = 0, size: number = 10, sort: string = "createdAt,desc") =>
    `${BASE_URL}/blogs/${blogId}/comments?page=${page}&size=${size}&sort=${encodeURIComponent(sort)}`,
  addComment: (blogId: number) => `${BASE_URL}/blogs/${blogId}/comments`,
  deleteComment: (blogId: number, commentId: number) => `${BASE_URL}/blogs/${blogId}/comments/${commentId}`,
};
