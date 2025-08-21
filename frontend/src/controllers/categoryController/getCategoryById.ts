import { AxiosError } from "axios";
import { GetCategoryByIdData , CategoryListResponse } from "@/lib/types/settings/category";
import { getCategoryById } from "@/services/category/getCategoryById";

export const getCategoryByIdController = async (
    input : GetCategoryByIdData,
    accessToken: string
) : Promise<CategoryListResponse> => {
    try {
        const response = await getCategoryById(input, accessToken);
        return response;
    } catch (error) {
        let errorMessage = "An unknown error occurred while fetching the category.";

        if (error instanceof AxiosError) {
            errorMessage = error.response?.data?.message || error.message;
            console.error(
                `[CategoryController] Failed to fetch category - AxiosError: ${errorMessage}`
            );
        } else {
            console.error(
                `[CategoryController] Unexpected error while fetching category:`,
                error
            );
        }

        return {
            success: false,
            message: "Failed to fetch category.",
            data: null,
            errors: [errorMessage],
            timestamp: Date.now(),
            path: "/api/categories",
        };
    }
};
