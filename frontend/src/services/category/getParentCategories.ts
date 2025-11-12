
import { ParentCategoriesResponse } from "@/lib/types/settings/category";

import { CategoryMapper } from "@/mapper/categoryMapper";
import axiosInstance from "@/hooks/axios";

export const getParentCategories = async (
    accessToken: string
    ): Promise<ParentCategoriesResponse> => {
    const response = await axiosInstance.get<ParentCategoriesResponse>(
        CategoryMapper.getAllCategories,
        {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        }
    );
    return response.data;
    }