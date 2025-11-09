import { getPostById, PostApiError } from "@/services/post/postService";
import { mapSinglePost, MappedSinglePost } from "@/lib/mappers/postMapper";

/**
 * Result type for controller operations
 */
export interface PostControllerResult {
  success: boolean;
  data?: MappedSinglePost;
  message: string;
  errors: string[];
  statusCode?: number;
}

/**
 * Controller function to fetch a single post by ID with comprehensive error handling
 * @param postId - The unique identifier of the post
 * @param accessToken - Optional JWT token for authorization
 * @returns Promise resolving to a UI-friendly result object
 */
export async function getPostByIdController(
  postId: number,
  accessToken?: string
): Promise<PostControllerResult> {
  // Input validation
  if (!postId || postId <= 0) {
    return {
      success: false,
      message: 'Invalid post ID provided',
      errors: ['Post ID must be a positive number'],
      statusCode: 400
    };
  }

  try {
    console.log(`[PostController] Fetching post ${postId}`);

    // Call the service layer
    const response = await getPostById(postId, accessToken);

    // Check if response contains data
    if (!response.data) {
      return {
        success: false,
        message: 'Post data not found',
        errors: ['The server returned an empty response'],
        statusCode: 404
      };
    }

    // Map the raw data to frontend-friendly format
    const mappedPost = mapSinglePost(response.data);

    console.log(`[PostController] Successfully processed post ${postId}`);

    return {
      success: true,
      data: mappedPost,
      message: 'Post retrieved successfully',
      errors: []
    };

  } catch (error) {
    console.error(`[PostController] Error fetching post ${postId}:`, error);

    // Handle specific API errors
    if (error instanceof PostApiError) {
      return {
        success: false,
        message: getUserFriendlyMessage(error.status, error.message),
        errors: error.errors,
        statusCode: error.status
      };
    }

    // Handle mapping or other unexpected errors
    if (error instanceof Error) {
      return {
        success: false,
        message: 'An unexpected error occurred while processing the post',
        errors: [error.message],
        statusCode: 500
      };
    }

    // Fallback for unknown errors
    return {
      success: false,
      message: 'An unknown error occurred',
      errors: ['Please try again later'],
      statusCode: 500
    };
  }
}

/**
 * Converts technical error messages to user-friendly messages
 * @param statusCode - HTTP status code
 * @param originalMessage - Original error message from API
 * @returns User-friendly error message
 */
function getUserFriendlyMessage(statusCode: number, originalMessage: string): string {
  switch (statusCode) {
    case 401:
      return 'You need to be logged in to view this post';
    case 403:
      return 'You don\'t have permission to view this post';
    case 404:
      return 'This post doesn\'t exist or may have been deleted';
    case 500:
      return 'Server error. Please try again later';
    case 0:
      return 'Unable to connect to the server. Please check your internet connection';
    default:
      return originalMessage || 'An error occurred while loading the post';
  }
}

/**
 * Utility function to check if a post controller result represents an error
 * @param result - The controller result to check
 * @returns true if the result represents an error
 */
export function isPostError(result: PostControllerResult): boolean {
  return !result.success;
}

/**
 * Utility function to extract error message from controller result
 * @param result - The controller result
 * @returns The primary error message
 */
export function getPostErrorMessage(result: PostControllerResult): string {
  if (result.success) return '';
  return result.message || 'An unknown error occurred';
}

/**
 * Utility function to check if error is a network/connectivity issue
 * @param result - The controller result
 * @returns true if it's a network error
 */
export function isNetworkError(result: PostControllerResult): boolean {
  return result.statusCode === 0 || result.message.toLowerCase().includes('network');
}

/**
 * Utility function to check if error is due to missing post
 * @param result - The controller result
 * @returns true if post was not found
 */
export function isPostNotFound(result: PostControllerResult): boolean {
  return result.statusCode === 404;
}

/**
 * Utility function to check if error is due to authorization
 * @param result - The controller result
 * @returns true if it's an auth error (401 or 403)
 */
export function isAuthError(result: PostControllerResult): boolean {
  return result.statusCode === 401 || result.statusCode === 403;
}
