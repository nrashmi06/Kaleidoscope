import { createBlog } from "@/services/blog/createBlogService";
import { 
  BlogRequest, 
  CreateBlogControllerResult,
  BlogDataResponse
} from "@/lib/types/createBlog";
import { CreateBlogServiceResponse } from "@/lib/types/createBlog";

/**
 * Controller to create a new blog post.
 * * @param payload - The blog request payload.
 * @param accessToken - The user's JWT token.
 * @returns A promise resolving to a normalized result object for the UI.
 */
export async function createBlogController(
  payload: BlogRequest,
  accessToken: string
): Promise<CreateBlogControllerResult> {
  
  if (!accessToken) {
    return { success: false, message: "Authentication token is missing." };
  }
  
  // Basic validation
  if (!payload.title.trim() || !payload.body.trim()) {
    return { success: false, message: "Title and body content are required." };
  }
  
  try {
    const result: CreateBlogServiceResponse = await createBlog(payload, accessToken);
    
    // Check for success:true (201 Created)
    if (result.success && typeof result.data === 'string') {
      return {
        success: true,
        message: result.message || "Blog created successfully!",
        data: result.data // The string response payload
      };
    }
    
    // Handle any response where creation was unsuccessful (4xx, or server internal validation failure)
    if (!result.success || (result.errors && result.errors.length > 0)) {
      const errorMessage = 
        result.message || 
        result.errors?.join(", ") || 
        "Failed to create blog due to server or validation error.";
        
      console.error("[BlogController] Creation failed:", errorMessage, result.errors);
      
      // Data field may contain the unsuccessful blog object on 4xx errors
      const errorData = (result as { data: BlogDataResponse }).data; 

      return {
        success: false,
        message: errorMessage,
        data: errorData,
      };
    }

    // Fallback for unexpected success structure (e.g., if a full BlogDataResponse was returned on 201)
    // We treat this as a failed normalization/unexpected path but don't re-throw the error
    return {
      success: false,
      message: "Blog created, but the server response format was unexpected. Please check post list.",
    };
    
  } catch (error) {
    console.error("[BlogController] Exception during blog creation:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred during processing.",
    };
  }
}