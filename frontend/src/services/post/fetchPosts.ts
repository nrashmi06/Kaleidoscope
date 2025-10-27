export interface Post {
  postId: number;
  title: string;
  body?: string;
  summary: string;
  visibility: "PUBLIC" | "PRIVATE" | "FOLLOWERS_ONLY";
  createdAt: string;
  updatedAt?: string;
  author: {
    userId: number;
    username: string;
    profilePictureUrl?: string;
  };
  location?: {
    locationId: number;
    name: string;
    city: string;
    country: string;
  };
  categories: Array<{
    categoryId: number;
    name: string;
  }>;
  mediaDetails?: Array<{
    url: string;
    mediaType: "IMAGE" | "VIDEO";
    position: number;
    width: number;
    height: number;
    fileSizeKb: number;
    durationSeconds?: number | null;
    extraMetadata?: Record<string, unknown>;
  }>;
  taggedUsers?: Array<{
    userId: number;
    username: string;
  }>;
  thumbnailUrl?: string;
  likeCount?: number;
  commentCount: number;
  reactionCount?: number;
  shareCount?: number;
  isLikedByCurrentUser?: boolean;
}

export interface FetchPostsResponse {
  success: boolean;
  message: string;
  data: {
    content: Post[];
    totalElements: number;
    page: number;
    size: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  errors: unknown[];
  timestamp: number;
  path: string;
}

export const fetchPostsService = async (
  accessToken: string,
  options?: {
    page?: number;
    size?: number;
    sort?: string; // Changed to match backend format: "createdAt,desc"
    sortBy?: string; // Keep for backward compatibility
    sortDirection?: "ASC" | "DESC"; // Keep for backward compatibility
  }
): Promise<{ success: boolean; data?: FetchPostsResponse; error?: string }> => {
  try {
    const params = new URLSearchParams();
    
    if (options?.page !== undefined) params.append('page', options.page.toString());
    if (options?.size !== undefined) params.append('size', options.size.toString());
    
    // Handle sort parameter - prefer new format, fallback to old format
    if (options?.sort) {
      params.append('sort', options.sort);
    } else if (options?.sortBy && options?.sortDirection) {
      // Convert old format to new format
      const direction = options.sortDirection.toLowerCase();
      params.append('sort', `${options.sortBy},${direction}`);
    } else if (options?.sortBy) {
      // Default to desc if no direction specified
      params.append('sort', `${options.sortBy},desc`);
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_BACKEND_URL || 'http://127.0.0.1:8080';
    const url = `${baseUrl}/kaleidoscope/api/posts${params.toString() ? `?${params.toString()}` : ''}`;
    
    console.log('Fetching posts from:', url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('Posts fetch response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error Response:', errorData);
      return {
        success: false,
        error: errorData.message || "Failed to fetch posts",
      };
    }

    const responseData = await response.json();
    console.log('Posts fetch response:', responseData);
    
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
    console.error('Network error fetching posts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
    };
  }
};
