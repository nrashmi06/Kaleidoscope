import {AxiosError} from "axios";
import {CreateCategoryData, CreateCategoryResponse} from "@/lib/types/settings/category";
import { updateCategory } from "@/services/category/updateCategory";

export const updateCategoryController = async (
    categoryId: number,
    input: CreateCategoryData,
    accessToken: string
): Promise<CreateCategoryResponse> => {
    try {
        const response = await updateCategory(categoryId, input, accessToken);
        return response;
    } catch (error) {
        let errorMessage = "An unknown error occurred while updating the category.";

        if (error instanceof AxiosError) {
            errorMessage = error.response?.data?.message || error.message;
            console.error(
                `[CategoryController] Failed to update category - AxiosError: ${errorMessage}`
            );
        } else {
            console.error(
                `[CategoryController] Unexpected error while updating category:`,
                error
            );
        }

        return {
            success: false,
            message: "Failed to update category.",
            data: null,
            errors: [errorMessage],
            timestamp: Date.now(),
            path: "/api/categories",
        };
    }
};
