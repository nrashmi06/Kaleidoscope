const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api`;

export const UserTagMapper = {
  /**
   * Builds the API URL for fetching taggable users.
   * Example: /api/users/taggable-users?q=john&page=0&size=10
   *
   * @param query - Search term (username or email)
   * @param page - Page number (default: 0)
   * @param size - Page size (default: 10)
   * @param sort - Optional sort parameter (e.g., 'username,asc')
   */
  getTaggableUsers: (
    query: string,
    page: number = 0,
    size: number = 10,
    sort?: string
  ) => {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      size: size.toString(),
    });
    if (sort) params.append("sort", sort);

    return `${BASE_URL}/users/taggable-users?${params.toString()}`;
  },
  // Create a user tag
  createTag: () => `${BASE_URL}/users/tags`,
  // Delete a user tag by id
  deleteTag: (tagId: number) => `${BASE_URL}/users/tags/${tagId}`,
};
