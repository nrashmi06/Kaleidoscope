import { AxiosError } from "axios";
import { TaggableUsersResponse } from "@/lib/types/usertag";
import { getTaggableUsers } from "@/services/userTag/getTaggableUsers";

/**
 * ✅ Controller for fetching taggable users
 * Endpoint: GET /api/users/taggable-users
 *
 * @param accessToken - Bearer token for authentication
 * @param query - Search query for username or email
 * @param page - Page number (default = 0)
 * @param size - Page size (default = 20)
 * @returns TaggableUsersResponse (standard API format)
 */
export const getTaggableUsersController = async (
  accessToken: string,
  query: string,
  page: number = 0,
  size: number = 20
): Promise<TaggableUsersResponse> => {
  try {
    // ✅ Call the service layer
    const response = await getTaggableUsers(accessToken, query, page, size);
    return response;
  } catch (error) {
    let errorMessage = "An unknown error occurred while fetching taggable users.";

    if (error instanceof AxiosError) {
      errorMessage = error.response?.data?.message || error.message;
      console.error(
        `[UserTagController] Failed to fetch taggable users - AxiosError: ${errorMessage}`
      );
    } else {
      console.error(
        `[UserTagController] Unexpected error while fetching taggable users:`,
        error
      );
    }

    // ✅ Standardized API response on failure
    return {
      success: false,
      message: "Failed to fetch taggable users.",
      data: null,
      errors: [errorMessage],
      timestamp: Date.now(),
      path: "/api/users/taggable-users",
    };
  }
};
