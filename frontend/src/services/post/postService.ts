import { SinglePostResponse } from "@/lib/types/post";

/**
 * API Error class for handling different error scenarios
 */
export class PostApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: string[],
    public path?: string
  ) {
    super(message);
    this.name = 'PostApiError';
  }
}

/**
 * Fetches a single post by its ID from the backend API
 * @param postId - The unique identifier of the post
 * @param accessToken - JWT token for authorization
 * @returns Promise resolving to the post data
 * @throws PostApiError for various error scenarios
 */
export async function getPostById(
  postId: number,
  accessToken?: string
): Promise<SinglePostResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_BACKEND_URL || 'http://localhost:8080';
  const url = `${baseUrl}/api/posts/${postId}`;

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if token is provided
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    console.log(`[PostService] Fetching post ${postId} from: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers,
      // Add cache control for better performance
      cache: 'no-store', // Ensure fresh data for post details
    });

    console.log(`[PostService] Response status: ${response.status}`);

    // Handle different status codes
    if (!response.ok) {
      let errorData: any;
      
      try {
        errorData = await response.json();
      } catch {
        // If response is not JSON, create a generic error
        errorData = {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
          errors: [`Request failed with status ${response.status}`],
          timestamp: Date.now(),
          path: `/api/posts/${postId}`
        };
      }

      const errorMessage = errorData.message || `Failed to fetch post ${postId}`;
      const errors = errorData.errors || [errorMessage];

      // Throw specific error based on status code
      switch (response.status) {
        case 401:
          throw new PostApiError(401, 'Unauthorized access', errors, errorData.path);
        case 403:
          throw new PostApiError(403, 'Access denied to this post', errors, errorData.path);
        case 404:
          throw new PostApiError(404, 'Post not found', errors, errorData.path);
        default:
          throw new PostApiError(response.status, errorMessage, errors, errorData.path);
      }
    }

    // Parse successful response
    const responseData: SinglePostResponse = await response.json();

    // Validate response structure
    if (!responseData.success || !responseData.data) {
      throw new PostApiError(
        500,
        'Invalid response format from server',
        ['Response data is malformed'],
        `/api/posts/${postId}`
      );
    }

    console.log(`[PostService] Successfully fetched post ${postId}`);
    return responseData;

  } catch (error) {
    // Re-throw PostApiError as-is
    if (error instanceof PostApiError) {
      throw error;
    }

    // Handle network errors and other exceptions
    console.error(`[PostService] Error fetching post ${postId}:`, error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new PostApiError(
        0,
        'Network error: Unable to connect to server',
        ['Please check your internet connection and try again'],
        `/api/posts/${postId}`
      );
    }

    // Generic error fallback
    throw new PostApiError(
      500,
      'An unexpected error occurred',
      [error instanceof Error ? error.message : 'Unknown error'],
      `/api/posts/${postId}`
    );
  }
}
