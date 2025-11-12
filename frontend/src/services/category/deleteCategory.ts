
import { DeleteCategoryData, DeleteCategoryResponse } from '@/lib/types/settings/category';
import { CategoryMapper } from '@/mapper/categoryMapper';
import axiosInstance from '@/hooks/axios';

export const deleteCategory = async (
  input: DeleteCategoryData,
  accessToken: string
): Promise<DeleteCategoryResponse> => {
  const response = await axiosInstance.delete<DeleteCategoryResponse>(
    CategoryMapper.deleteCategory(input.categoryId),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data;
};