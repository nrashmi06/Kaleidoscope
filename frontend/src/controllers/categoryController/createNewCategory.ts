import {AxiosError} from "axios";
import { CreateCategoryData , CreateCategoryResponse } from "@/lib/types/settings/category";
import { createNewCategory } from "@/services/category/createNewCategory";

export const createNewCategoryController = async (
    input: CreateCategoryData,
    accessToken: string
) : Promise<CreateCategoryResponse> => {
    try {
        const response = await createNewCategory(input, accessToken);
        return response;
    } catch (error) {
        let errorMessage = "An unknown error occurred while creating the category.";

        if (error instanceof AxiosError) {
            errorMessage = error.response?.data?.message || error.message;
            console.error(
                `[CategoryController] Failed to create category - AxiosError: ${errorMessage}`
            );
        } else {
            console.error(
                `[CategoryController] Unexpected error while creating category:`,
                error
            );
        }

        return {
            success: false,
            message: "Failed to create category.",
            data: null,
            errors: [errorMessage],
            timestamp: Date.now(),
            path: "/api/categories",
        };
    }
};
