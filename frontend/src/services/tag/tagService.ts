import { 
  TagApiResponse, 
  TagsByContentParams, 
  TagQueryParams,
  TagError,
  TagErrorType,
  ContentType 
} from "@/lib/types/tag";

/**
 * Custom error class for tag API operations
 */
export class TagApiError extends Error {
  constructor(
    public type: TagErrorType,
    message: string,
    public details?: string[]
  ) {
    super(message);
    this.name = 'TagApiError';
  }
}

/**
 * Validates content type parameter
 */
function validateContentType(contentType: string): ContentType {
  const validTypes: ContentType[] = ["POST", "BLOG", "STORY", "COMMENT"];
  const upperType = contentType.toUpperCase() as ContentType;
  
  if (!validTypes.includes(upperType)) {
    throw new TagApiError(
      "INVALID_CONTENT_TYPE",
      `Invalid content type: ${contentType}`,
      [`Valid types are: ${validTypes.join(", ")}`]
    );
  }
  
  return upperType;
}

/**
 * Builds query string from tag query parameters
 */
function buildQueryString(params: TagQueryParams): string {
  const searchParams = new URLSearchParams();
  
  if (params.page !== undefined) {
    searchParams.append('page', params.page.toString());
  }
  
  if (params.size !== undefined) {
    searchParams.append('size', params.size.toString());
  }
  
  if (params.sort && params.sort.length > 0) {
    params.sort.forEach(sortParam => {
      searchParams.append('sort', sortParam);
    });
  }
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Fetches tags for a specific content item
 * @param params - Content type, ID, and optional query parameters
 * @param accessToken - JWT token for authorization
 * @returns Promise resolving to tag data
 * @throws TagApiError for various error scenarios
 */
export async function getTagsByContent(
  params: TagsByContentParams,
  accessToken?: string
): Promise<TagApiResponse> {
  // Validate input parameters
  if (!params.contentId || params.contentId <= 0) {
    throw new TagApiError(
      "INVALID_CONTENT_TYPE",
      "Invalid content ID",
      ["Content ID must be a positive number"]
    );
  }

  const contentType = validateContentType(params.contentType);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_BACKEND_URL || 'http://localhost:8080';
  const queryString = buildQueryString(params.queryParams || {});
  const url = `${baseUrl}/api/content/${contentType}/${params.contentId}/tags${queryString}`;

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if token is provided
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    console.log(`[TagService] Fetching tags for ${contentType} ${params.contentId} from: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers,
      // Cache policy - allow some caching for tags since they don't change frequently
      cache: 'default',
    });

    console.log(`[TagService] Response status: ${response.status}`);

    // Handle error responses
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
          path: `/api/content/${contentType}/${params.contentId}/tags`
        };
      }

      const errorMessage = errorData.message || `Failed to fetch tags for ${contentType} ${params.contentId}`;
      const errors = errorData.errors || [errorMessage];

      // Map HTTP status codes to tag error types
      switch (response.status) {
        case 401:
          throw new TagApiError("UNAUTHORIZED", errorMessage, errors);
        case 404:
          throw new TagApiError("CONTENT_NOT_FOUND", "Content not found or no tags available", errors);
        default:
          throw new TagApiError("UNKNOWN_ERROR", errorMessage, errors);
      }
    }

    // Parse successful response
    const responseData: TagApiResponse = await response.json();

    // Validate response structure
    if (!responseData.success) {
      throw new TagApiError(
        "UNKNOWN_ERROR",
        responseData.message || "API returned unsuccessful response",
        responseData.errors || []
      );
    }

    console.log(`[TagService] Successfully fetched ${responseData.data?.totalElements || 0} tags`);
    return responseData;

  } catch (error) {
    // Re-throw TagApiError as-is
    if (error instanceof TagApiError) {
      throw error;
    }

    // Handle network errors and other exceptions
    console.error(`[TagService] Error fetching tags:`, error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new TagApiError(
        "NETWORK_ERROR",
        "Network error: Unable to connect to server",
        ["Please check your internet connection and try again"]
      );
    }

    // Generic error fallback
    throw new TagApiError(
      "UNKNOWN_ERROR",
      "An unexpected error occurred",
      [error instanceof Error ? error.message : "Unknown error"]
    );
  }
}

/**
 * Convenience function to get first page of tags
 */
export async function getTagsByContentFirstPage(
  contentType: ContentType,
  contentId: number,
  accessToken?: string,
  pageSize: number = 10
): Promise<TagApiResponse> {
  return getTagsByContent({
    contentType,
    contentId,
    queryParams: {
      page: 0,
      size: pageSize,
      sort: ['createdAt,desc'] // Most recent first
    }
  }, accessToken);
}

/**
 * Convenience function to get tags with custom sorting
 */
export async function getTagsByContentSorted(
  contentType: ContentType,
  contentId: number,
  sortBy: string = 'createdAt,desc',
  accessToken?: string,
  page: number = 0,
  size: number = 10
): Promise<TagApiResponse> {
  return getTagsByContent({
    contentType,
    contentId,
    queryParams: {
      page,
      size,
      sort: [sortBy]
    }
  }, accessToken);
}
