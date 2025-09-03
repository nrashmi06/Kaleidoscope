import { tagUserService, TagUserRequest, TagUserResponse } from "@/services/user/tagUser";

export const tagUserController = async (
  request: TagUserRequest,
  accessToken: string
): Promise<{ success: boolean; data?: TagUserResponse; error?: string }> => {
  try {
    console.log(`[TagUserController] Processing tag request for users:`, request.userIds);
    
    // Validate input
    if (!request.userIds || request.userIds.length === 0) {
      return {
        success: false,
        error: "No users selected for tagging",
      };
    }
    
    if (!request.postId) {
      return {
        success: false,
        error: "Post ID is required for tagging users",
      };
    }
    
    // Validate user IDs are positive numbers
    const invalidUserIds = request.userIds.filter(id => !Number.isInteger(id) || id <= 0);
    if (invalidUserIds.length > 0) {
      return {
        success: false,
        error: `Invalid user IDs detected: ${invalidUserIds.join(", ")}`,
      };
    }
    
    const result = await tagUserService(request, accessToken);
    
    if (!result.success) {
      console.error(`[TagUserController] Failed to tag users:`, result.error);
      return {
        success: false,
        error: result.error || "Failed to tag users",
      };
    }
    
    console.log(`[TagUserController] Users tagged successfully`);
    return result;
    
  } catch (error) {
    console.error(`[TagUserController] Error in tagUserController:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};
