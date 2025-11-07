import axios, { AxiosError } from "axios";
import { UserTagMapper } from "@/mapper/usertagMapper";
import { TaggableUsersResponse } from "@/lib/types/usertag";

/**
 * Fetches taggable users based on a search query.
 * Endpoint: GET /api/users/taggable-users
 *
 * @param accessToken - Bearer token for authentication
 * @param query - Search query for username or email
 * @param page - Page number (default = 0)
 * @param size - Page size (default = 20)
 * @returns A structured TaggableUsersResponse
 */
export const getTaggableUsers = async (
  accessToken: string,
  query: string,
  page: number = 0,
  size: number = 20
): Promise<TaggableUsersResponse> => {
  try {
    const response = await axios.get<TaggableUsersResponse>(
      UserTagMapper.getTaggableUsers(query, page, size),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("[getTaggableUsers] Error:", error);

    // ✅ Handle Axios errors cleanly
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<TaggableUsersResponse>;
      return (
        axiosError.response?.data || {
          success: false,
          message: "Failed to fetch taggable users.",
          errors: [axiosError.message],
          data: null,
          timestamp: Date.now(),
          path: `/api/users/taggable-users`,
        }
      );
    }

    // ✅ Fallback for unexpected non-Axios errors
    return {
      success: false,
      message: "Unexpected error fetching taggable users.",
      errors: ["Unknown error"],
      data: null,
      timestamp: Date.now(),
      path: `/api/users/taggable-users`,
    };
  }
};
