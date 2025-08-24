import { AxiosError } from "axios";
import { DeleteCategoryData, DeleteCategoryResponse } from "@/lib/types/settings/category";
import { deleteCategory } from "@/services/category/deleteCategory";

export const deleteCategoryController = async (
  input: DeleteCategoryData,    
  accessToken: string
): Promise<DeleteCategoryResponse> => {
  try {
    console.log(`[CategoryController] Attempting to delete category with ID: ${input.categoryId}`);
    const response = await deleteCategory(input, accessToken);
    console.log(`[CategoryController] Delete response:`, response);
    return response;
  } catch (error) {
    let errorMessage = "An unknown error occurred while deleting the category.";

    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const responseData = error.response?.data;
      
      console.error(`[CategoryController] Failed to delete category - Status: ${status}`, responseData);
      
      if (status === 409) {
        errorMessage = "Category cannot be deleted because it has dependencies or conflicts.";
      } else if (status === 500) {
        errorMessage = responseData?.message || "Internal server error occurred while deleting the category.";
      } else if (status === 404) {
        errorMessage = "Category not found.";
      } else {
        errorMessage = responseData?.message || error.message;
      }
      
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