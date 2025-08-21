import axios from "axios";
import { ParentCategoriesResponse } from "@/lib/types/settings/category";

import { CategoryMapper } from "@/mapper/categoryMapper";

export const getParentCategories = async (
    accessToken: string
    ): Promise<ParentCategoriesResponse> => {
    const response = await axios.get<ParentCategoriesResponse>(
        CategoryMapper.getAllCategories,
        {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        }
    );
    return response.data;
    }