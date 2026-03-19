const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api`;

export const BlogReactionMapper = {
  getReactionsForBlog: (blogId: number) => `${BASE_URL}/blogs/${blogId}/reactions`,
  postReactionForBlog: (blogId: number) => `${BASE_URL}/blogs/${blogId}/reactions`,
};
