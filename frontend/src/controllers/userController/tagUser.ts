import { tagUserService } from "@/services/user/tagUser";
import { TagUserRequest, TagUserResponse } from "@/lib/types/post";

export const tagUserController = async (
  request: TagUserRequest,
  accessToken: string
): Promise<{ success: boolean; data?: TagUserResponse; error?: string }> => {
  try {
    console.log(`[TagUserController] Processing tag request:`, request);

    if (!request.taggedUserId || request.taggedUserId <= 0) {
      return { success: false, error: "Invalid tagged user ID" };
    }

    if (!request.contentId || request.contentId <= 0) {
      return { success: false, error: "Invalid content ID" };
    }

    if (!["POST", "COMMENT"].includes(request.contentType)) {
      return { success: false, error: "Invalid content type" };
    }

    const result = await tagUserService(request, accessToken);

    if (!result.success) {
      return { success: false, error: result.error || "Failed to tag user" };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};
