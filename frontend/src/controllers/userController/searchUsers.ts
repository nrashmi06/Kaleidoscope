import { AxiosError } from "axios";
import { UsersResponse } from "@/lib/types/post";
import { searchUsers } from "@/services/user/searchUsers";

export const searchUsersController = async (
  accessToken: string,
  query: string,
  page: number = 0,
  size: number = 20
): Promise<UsersResponse> => {
  try {
    const response = await searchUsers(accessToken, query, page, size);
    return response;
  } catch (error) {
    let errorMessage = "An unknown error occurred while searching users.";

    if (error instanceof AxiosError) {
      errorMessage = error.response?.data?.message || error.message;
      console.error(
        `[UserController] Failed to search users - AxiosError: ${errorMessage}`
      );
    } else {
      console.error(
        `[UserController] Unexpected error while searching users:`,
        error
      );
    }

    return {
      success: false,
      message: "Failed to search users.",
      data: null,
      errors: [errorMessage],
      timestamp: Date.now(),
      path: "/api/users/search",
    };
  }
};
