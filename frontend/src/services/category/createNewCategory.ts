
import { CreateCategoryData , CreateCategoryResponse } from '@/lib/types/settings/category';

import { CategoryMapper } from '@/mapper/categoryMapper';
import axiosInstance from '@/hooks/axios';

export const createNewCategory = async (
    input : CreateCategoryData,
    accessToken: string
): Promise<CreateCategoryResponse> => {
    const response = await axiosInstance.post<CreateCategoryResponse>(
        CategoryMapper.createCategory,
        input,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );
    return response.data;
};