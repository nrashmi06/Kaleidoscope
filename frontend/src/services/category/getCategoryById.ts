
import {GetCategoryByIdData,CategoryListResponse} from '@/lib/types/settings/category';

import {CategoryMapper} from '@/mapper/categoryMapper';
import axiosInstance from '@/hooks/axios';

export const getCategoryById = async (
  input: GetCategoryByIdData,
  accessToken: string
): Promise<CategoryListResponse> => {
  const response = await axiosInstance.get<CategoryListResponse>(
    CategoryMapper.getCategoryById(input.categoryId),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data;
};