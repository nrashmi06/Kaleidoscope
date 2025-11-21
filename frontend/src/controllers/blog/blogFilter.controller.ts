// controllers/blogFilter.controller.ts
import { filterBlogsService } from "@/services/blog/blogFilter.service";
import { 
  BlogFilterRequest, 
  BlogFilterResponsePayload, 
  BlogFilterControllerResult, 
  BlogFilterResponse,
  PaginationMeta,
  BlogItem
} from "@/lib/types/blogFilter.types";

/**
 * Default pagination for empty or error states.
 */
const defaultPagination: PaginationMeta = {
  page: 0,
  size: 10,
  totalPages: 0,
  totalElements: 0,
  first: true,
  last: true,
};

/**
 * Fetches and processes filtered blogs.
 * @param accessToken - The user's JWT.
 * @param filters - The filter parameters.
 * @returns A promise resolving to a normalized result for the UI.
 */
export async function filterBlogsController(
  accessToken: string,
  filters: BlogFilterRequest
): Promise<BlogFilterControllerResult> {
  
  if (!accessToken) {
    return { 
      success: false, 
      blogs: [], 
      pagination: defaultPagination, 
      error: "Authentication token is missing." 
    };
  }

  // Set default pagination if missing
  const finalFilters: BlogFilterRequest = {
    page: 0,
    sort: "createdAt,desc",
    ...filters,
  };

  try {
    const response: BlogFilterResponse = await filterBlogsService(accessToken, finalFilters);

    if (!response.success) {
      throw new Error(response.message || response.errors.join(", ") || "Failed to load blogs.");
    }
    
    // The data payload from the service should match BlogFilterResponsePayload if successful
    const data: BlogFilterResponsePayload | null = response.data as BlogFilterResponsePayload | null;

    if (!data || !data.content) {
       return {
          success: true,
          blogs: [],
          pagination: { ...defaultPagination, size: finalFilters.size || 10 },
          error: "No blogs found for the current filter criteria."
       }
    }

    // Since BlogItem is already clean, no deep mapping is needed
    const normalizedBlogs: BlogItem[] = data.content;

    return {
      success: true,
      blogs: normalizedBlogs,
      pagination: {
        page: data.page,
        size: data.size,
        totalPages: data.totalPages,
        totalElements: data.totalElements,
        first: data.first,
        last: data.last,
      },
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("[BlogFilterController] Error:", errorMessage);
    
    return {
      success: false,
      blogs: [],
      pagination: defaultPagination,
      error: errorMessage,
    };
  }
}