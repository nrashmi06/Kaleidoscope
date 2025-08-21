import { AxiosError } from "axios";
import { DeleteCategoryData, DeleteCategoryResponse } from "@/lib/types/settings/category";
import { deleteCategory } from "@/services/category/deleteCategory";

export const deleteCategoryController = async (
  input: DeleteCategoryData,    
  accessToken: string
): Promise<DeleteCategoryResponse> => {
  try {
    const response = await deleteCategory(input, accessToken);
    return response;
  } catch (error) {
    let errorMessage = "An unknown error occurred while deleting the category.";

    if (error instanceof AxiosError) {
      errorMessage = error.response?.data?.message || error.message;
      console.error(
        `[CategoryController] Failed to delete category - AxiosError: ${errorMessage}`
      );
    } else {
      console.error(
        `[CategoryController] Unexpected error while deleting category:`,
        error
      );
    }

    return {
      success: false,
      message: "Failed to delete category.",
      data: null,
      errors: [errorMessage],
      timestamp: Date.now(),
      path: "/api/categories",
    };
  }
}