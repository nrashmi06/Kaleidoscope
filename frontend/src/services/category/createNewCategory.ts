import axios from 'axios';
import { CreateCategoryData , CreateCategoryResponse } from '@/lib/types/settings/category';

import { CategoryMapper } from '@/mapper/categoryMapper';

export const createNewCategory = async (
    input : CreateCategoryData,
    accessToken: string
): Promise<CreateCategoryResponse> => {
    const response = await axios.post<CreateCategoryResponse>(
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