import { createBlog } from "@/services/blog/createBlogService";
import { 
  BlogRequest, 
  CreateBlogControllerResult,
  BlogDataResponse
} from "@/lib/types/createBlog";
import { CreateBlogServiceResponse } from "@/lib/types/createBlog";

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
    
    // ✅ FIXED: Check if success is true. 
    // We accept 'data' as either a string OR an object (the created blog).
    if (result.success) {
      return {
        success: true,
        message: result.message || "Blog created successfully!",
        data: result.data 
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
      // We need to cast it safely since result.data implies success types in strict mode
      const errorData = result.data as BlogDataResponse;

      return {
        success: false,
        message: errorMessage,
        data: errorData,
      };
    }

    // Fallback for truly unexpected states (should rarely be reached now)
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