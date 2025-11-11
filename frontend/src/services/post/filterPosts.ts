// src/services/post/filterPosts.ts
import { PostMapper } from '@/mapper/postMapper';
// ✅ Import our new, comprehensive types
import type { PostFilterParams } from '@/lib/types/postFeed';
import type { PaginatedPostsResponse } from '@/lib/types/postFeed';

// ✅ Rename the response type for clarity
export type FilterPostsApiResponse = PaginatedPostsResponse;

// ✅ Update function to use the strict PostFilterParams type
export const filterPostsService = async (
  accessToken: string,
  filterOptions: PostFilterParams = {} // Default to empty object
): Promise<FilterPostsApiResponse> => {
  const url = new URL(PostMapper.filterPosts);

  // --- Robust Query Param Serialization ---
  // Iterate over keys and append only if value is valid
  Object.entries(filterOptions).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      if (Array.isArray(value)) {
        // Handle array values, like 'sort'
        value.forEach((v) => url.searchParams.append(key, v));
      } else {
        // Handle primitive values
        url.searchParams.append(key, String(value));
      }
    }
  });

  const endpoint = url.toString();
  
  try {
    console.log('✅ [filterPostsService] Filtering posts:', endpoint);
    
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store', // Ensure fresh data for feeds
    });

    const responseData: FilterPostsApiResponse = await response.json();

    if (!response.ok) {
      console.error('✅ [filterPostsService] API Error:', responseData);
      return {
        ...responseData,
        success: false,
        message: responseData.message || "Failed to filter posts",
      };
    }
    
    return responseData;

  } catch (error) {
    console.error('✅ [filterPostsService] Network Error:', error);
    const errorMessage = error instanceof Error ? error.message : "Network error occurred";
    return {
      success: false,
      message: errorMessage,
      data: null,
      errors: [errorMessage],
      timestamp: Date.now(),
      path: endpoint,
    };
  }
};