// mapper/hashtagMapper.ts
const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/kaleidoscope/api`;

export const HashtagMapper = {
  /**
   * Builds the API URL for fetching hashtag suggestions.
   * Example: /api/hashtags/suggest?prefix=java
   * 
   * @param prefix - The hashtag prefix to search for (e.g., 'java')
   */
  getHashtagSuggestions: (prefix: string) => 
    `${BASE_URL}/hashtags/suggest?prefix=${encodeURIComponent(prefix)}`,
};
