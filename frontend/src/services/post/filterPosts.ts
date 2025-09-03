import { PostMapper } from '@/mapper/postMapper';
import { FetchPostsResponse } from './fetchPosts';

export interface PostFilterOptions {
  page?: number;
  size?: number;
  sort?: string; // e.g., "createdAt,desc" or "title,asc"
  userId?: number; // Filter by specific user
  categoryId?: number; // Filter by category
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'; // Post status
  visibility?: 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS_ONLY'; // Post visibility
  q?: string; // Search query
  sortBy?: string; // Alternative sort field
  sortDirection?: 'ASC' | 'DESC'; // Alternative sort direction
}

export const filterPostsService = async (
  accessToken: string,
  filterOptions?: PostFilterOptions
): Promise<{ success: boolean; data?: FetchPostsResponse; error?: string }> => {
  try {
    const params = new URLSearchParams();
    
    // Add filter parameters
    if (filterOptions?.page !== undefined) params.append('page', filterOptions.page.toString());
    if (filterOptions?.size !== undefined) params.append('size', filterOptions.size.toString());
    
    // Handle sorting - prefer 'sort' format but fallback to individual params
    if (filterOptions?.sort) {
      params.append('sort', filterOptions.sort);
    } else {
      if (filterOptions?.sortBy) params.append('sortBy', filterOptions.sortBy);
      if (filterOptions?.sortDirection) params.append('sortDirection', filterOptions.sortDirection);
    }
    
    // Filter parameters
    if (filterOptions?.userId !== undefined) params.append('userId', filterOptions.userId.toString());
    if (filterOptions?.categoryId !== undefined) params.append('categoryId', filterOptions.categoryId.toString());
    if (filterOptions?.status) params.append('status', filterOptions.status);
    if (filterOptions?.visibility) params.append('visibility', filterOptions.visibility);
    if (filterOptions?.q) params.append('q', filterOptions.q);

    const url = `${PostMapper.filterPosts}${params.toString() ? `?${params.toString()}` : ''}`;
    
    console.log('🔍 Filtering posts with URL:', url);
    console.log('🔍 Filter options:', filterOptions);
    console.log('🔍 Search query (q parameter):', filterOptions?.q);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('🔍 Filter response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('🔍 Filter API Error Response:', errorData);
      return {
        success: false,
        error: errorData.message || "Failed to filter posts",
      };
    }

    const responseData = await response.json();
    console.log('🔍 Filter response:', responseData);
    
    if (!responseData.success) {
      return {
        success: false,
        error: responseData.message || "Backend returned unsuccessful response",
      };
    }
    
    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    console.error('🔍 Network error filtering posts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
    };
  }
};
