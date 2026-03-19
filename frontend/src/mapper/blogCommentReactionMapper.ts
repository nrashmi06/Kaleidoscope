const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api`;

export const BlogCommentReactionMapper = {
  getReactionsForComment: (blogId: number, commentId: number) =>
    `${BASE_URL}/blogs/${blogId}/comments/${commentId}/reactions`,
  postReactionForComment: (blogId: number, commentId: number) =>
    `${BASE_URL}/blogs/${blogId}/comments/${commentId}/reactions`,
};
