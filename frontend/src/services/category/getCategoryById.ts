import axios from 'axios';
import {GetCategoryByIdData,CategoryListResponse} from '@/lib/types/settings/category';

import {CategoryMapper} from '@/mapper/categoryMapper';

export const getCategoryById = async (
  input: GetCategoryByIdData,
  accessToken: string
): Promise<CategoryListResponse> => {
  const response = await axios.get<CategoryListResponse>(
    CategoryMapper.getCategoryById(input.categoryId),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data;
};