// services/blogFilter.service.ts
import { AxiosError } from "axios";
import axiosInstance, { isAxiosError } from "@/hooks/axios";
import { BLOG_ENDPOINTS } from "@/mapper/blogMapper";
import { 
  BlogFilterRequest, 
  BlogFilterResponse, 
  BlogFilterResponsePayload, 
  StandardApiResponse
} from "@/lib/types/blogFilter.types"; 

/**
 * Filters and fetches a paginated list of blogs from the API.
 * @param accessToken - The user's JWT.
 * @param params - The filter parameters.
 * @returns A promise resolving to the API response (StandardApiResponse<BlogFilterResponsePayload>).
 */
export async function filterBlogsService(
  accessToken: string,
  params: BlogFilterRequest
): Promise<BlogFilterResponse> {
  const url = new URL(BLOG_ENDPOINTS.FILTER);
  const endpoint = url.toString();

  // Filter out null/undefined/empty string values and build query parameters
  const queryParams: Record<string, string | number> = {};
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      if (key === 'sort' && Array.isArray(value)) {
        // Axios handles array parameters correctly by mapping multiple times
        queryParams.sort = value.map(String) as unknown as string; // Trick TS to pass array
      } else if (typeof value === 'number' || typeof value === 'string') {
        queryParams[key] = value;
      }
    }
  });

  try {
    const response = await axiosInstance.get<BlogFilterResponse>(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: queryParams, // Axios correctly builds the query string
    });
    
    // Axios returns the status 200 response data.
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<BlogFilterResponse>;
      const errorData = axiosError.response?.data;
      
      // Normalize the error return to the expected StandardApiResponse type.
      return {
        success: false,
        message: errorData?.message || `HTTP ${axiosError.response?.status} Error`,
        data: errorData?.data || null,
        errors: errorData?.errors || [axiosError.message],
        timestamp: Date.now(),
        path: endpoint,
      } as StandardApiResponse<BlogFilterResponsePayload>;
    }

    const message = error instanceof Error ? error.message : "Unexpected network error";

    return {
      success: false,
      message,
      data: null,
      errors: [message],
      timestamp: Date.now(),
      path: endpoint,
    } as StandardApiResponse<BlogFilterResponsePayload>;
  }
}