import { AxiosError } from "axios";
import { getParentCategories } from "@/services/category/getParentCategories";
import { ParentCategoriesResponse } from "@/lib/types/settings/category";

export const getParentCategoriesController = async (
  accessToken: string
): Promise<ParentCategoriesResponse> => {
  try {
    const response = await getParentCategories(accessToken);
    return response;
  } catch (error) {
    let errorMessage = "An unknown error occurred while fetching parent categories.";

    if (error instanceof AxiosError) {
      errorMessage = error.response?.data?.message || error.message;
      console.error(
        `[CategoryController] Failed to fetch parent categories - AxiosError: ${errorMessage}`
      );
    } else {
      console.error(
        `[CategoryController] Unexpected error while fetching parent categories:`,
        error
      );
    }

    return {
      success: false,
      message: "Failed to fetch parent categories.",
      data: null,
      errors: [errorMessage],
      timestamp: Date.now(),
      path: "/api/categories",
    };
  }
};
