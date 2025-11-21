import { AxiosError } from "axios";
import { axiosInstance } from "@/hooks/axios"; // Use existing hook for axios instance
import { 
  BlogRequest, 
  CreateBlogServiceResponse, 
  BlogDataResponse, 
  StandardApiResponse 
} from "@/lib/types/createBlog"; 
import { BLOG_ENDPOINTS } from "@/mapper/blogMapper";

/**
 * Creates a new blog post via the API.
 * * @param payload - The blog request payload.
 * @param accessToken - The user's JWT token.
 * @returns A promise resolving to the raw API response structure.
 */
export async function createBlog(
  payload: BlogRequest,
  accessToken: string
): Promise<CreateBlogServiceResponse> {
  const url = BLOG_ENDPOINTS.CREATE;
  
  try {
    const response = await axiosInstance.post<CreateBlogServiceResponse>(
      url,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // If a 2xx response is received, return the data directly.
    return response.data;
    
  } catch (error) {
    // Handle Axios error for non-2xx responses (4xx/5xx)
    if (error instanceof AxiosError && error.response?.data) {
      // Return the structured response body from the server, 
      // which should be one of the expected response schemas.
      return error.response.data as CreateBlogServiceResponse;
    }

    // Fallback for network/unexpected errors
    const message = error instanceof Error ? error.message : "Unexpected network error";
    
    // Fabricate a generic failure response adhering to the promised structure.
    return {
      success: false,
      message,
      data: {} as BlogDataResponse, // Use empty object as placeholder for generic T on hard failure
      errors: [message],
      timestamp: Date.now(),
      path: url,
    } as StandardApiResponse<BlogDataResponse>; // Cast to the most detailed error response type
  }
}