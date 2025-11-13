import { 
  getTagsByContent, 
  TagApiError 
} from "@/services/tag/tagService";
import { 
  mapPaginatedTagResponse
} from "@/lib/mappers/tagMapper";
import {
  MappedPaginatedTagResponse
} from "@/lib/types/tag";
import { 
  TagsByContentParams, 
  ContentType, 
  TagError,
  TagErrorType 
} from "@/lib/types/tag";

/**
 * Result type for tag controller operations
 */
export interface TagControllerResult {
  success: boolean;
  data?: MappedPaginatedTagResponse;
  error?: TagError;
  isEmpty?: boolean;
}

/**
 * Controller function to fetch tags for content with comprehensive error handling
 * @param params - Content type, ID, and query parameters
 * @param accessToken - Optional JWT token for authorization
 * @param currentUserId - Optional current user ID for personalization
 * @returns Promise resolving to a UI-friendly result object
 */
export async function getTagsByContentController(
  params: TagsByContentParams,
  accessToken?: string,
  currentUserId?: number
): Promise<TagControllerResult> {
  // Input validation
  if (!params.contentType || !params.contentId) {
    return {
      success: false,
      error: {
        type: "INVALID_CONTENT_TYPE",
        message: "Content type and ID are required",
        details: ["Please provide valid content type and content ID"]
      }
    };
  }

  if (params.contentId <= 0) {
    return {
      success: false,
      error: {
        type: "INVALID_CONTENT_TYPE",
        message: "Invalid content ID",
        details: ["Content ID must be a positive number"]
      }
    };
  }

  try {
    console.log(`[TagController] Fetching tags for ${params.contentType} ${params.contentId}`);

    // Call the service layer
    const response = await getTagsByContent(params, accessToken);

    // Check if response contains data
    if (!response.data) {
      return {
        success: true,
        data: {
          tags: [],
          pagination: {
            page: 0,
            size: 10,
            totalPages: 0,
            totalElements: 0,
            hasNext: false,
            hasPrevious: false,
            isFirst: true,
            isLast: true
          }
        },
        isEmpty: true
      };
    }

    // Map the raw data to frontend-friendly format
    const mappedResponse = mapPaginatedTagResponse(response.data, currentUserId);

    console.log(`[TagController] Successfully processed ${mappedResponse.tags.length} tags`);

    return {
      success: true,
      data: mappedResponse,
      isEmpty: mappedResponse.tags.length === 0
    };

  } catch (error) {
    console.error(`[TagController] Error fetching tags:`, error);

    // Handle specific API errors
    if (error instanceof TagApiError) {
      return {
        success: false,
        error: {
          type: error.type,
          message: getUserFriendlyMessage(error.type, error.message),
          details: error.details
        }
      };
    }

    // Handle unexpected errors
    return {
      success: false,
      error: {
        type: "UNKNOWN_ERROR",
        message: "An unexpected error occurred while loading tags",
        details: [error instanceof Error ? error.message : "Unknown error"]
      }
    };
  }
}

/**
 * Convenience controller for getting the first page of tags
 */
export async function getTagsFirstPageController(
  contentType: ContentType,
  contentId: number,
  accessToken?: string,
  currentUserId?: number,
  pageSize: number = 10
): Promise<TagControllerResult> {
  return getTagsByContentController({
    contentType,
    contentId,
    queryParams: {
      page: 0,
      size: pageSize,
      sort: ['createdAt,desc']
    }
  }, accessToken, currentUserId);
}

/**
 * Controller for getting next page of tags
 */
export async function getTagsNextPageController(
  contentType: ContentType,
  contentId: number,
  currentPage: number,
  pageSize: number,
  accessToken?: string,
  currentUserId?: number
): Promise<TagControllerResult> {
  return getTagsByContentController({
    contentType,
    contentId,
    queryParams: {
      page: currentPage + 1,
      size: pageSize,
      sort: ['createdAt,desc']
    }
  }, accessToken, currentUserId);
}

/**
 * Controller for getting previous page of tags
 */
export async function getTagsPreviousPageController(
  contentType: ContentType,
  contentId: number,
  currentPage: number,
  pageSize: number,
  accessToken?: string,
  currentUserId?: number
): Promise<TagControllerResult> {
  const previousPage = Math.max(0, currentPage - 1);
  
  return getTagsByContentController({
    contentType,
    contentId,
    queryParams: {
      page: previousPage,
      size: pageSize,
      sort: ['createdAt,desc']
    }
  }, accessToken, currentUserId);
}

/**
 * Converts technical error messages to user-friendly messages
 */
function getUserFriendlyMessage(errorType: TagErrorType, originalMessage: string): string {
  switch (errorType) {
    case "UNAUTHORIZED":
      return "You need to be logged in to view tags";
    case "CONTENT_NOT_FOUND":
      return "Content not found or no tags available";
    case "INVALID_CONTENT_TYPE":
      return "Invalid content type provided";
    case "NETWORK_ERROR":
      return "Unable to connect to the server. Please check your internet connection";
    case "UNKNOWN_ERROR":
    default:
      return originalMessage || "An error occurred while loading tags";
  }
}

/**
 * Utility function to check if a tag controller result represents an error
 */
export function isTagError(result: TagControllerResult): boolean {
  return !result.success;
}

/**
 * Utility function to check if result has no tags (empty but successful)
 */
export function isTagsEmpty(result: TagControllerResult): boolean {
  return result.success && (result.isEmpty === true || result.data?.tags.length === 0);
}

/**
 * Utility function to extract error message from controller result
 */
export function getTagErrorMessage(result: TagControllerResult): string {
  if (result.success) return '';
  return result.error?.message || 'An unknown error occurred';
}

/**
 * Utility function to check if error is a network/connectivity issue
 */
export function isNetworkTagError(result: TagControllerResult): boolean {
  return result.error?.type === "NETWORK_ERROR";
}

/**
 * Utility function to check if error is due to authorization
 */
export function isAuthTagError(result: TagControllerResult): boolean {
  return result.error?.type === "UNAUTHORIZED";
}

/**
 * Utility function to check if content was not found
 */
export function isContentNotFoundError(result: TagControllerResult): boolean {
  return result.error?.type === "CONTENT_NOT_FOUND";
}
