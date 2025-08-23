import axios from 'axios';
import { DeleteCategoryData, DeleteCategoryResponse } from '@/lib/types/settings/category';
import { CategoryMapper } from '@/mapper/categoryMapper';

export const deleteCategory = async (
  input: DeleteCategoryData,
  accessToken: string
): Promise<DeleteCategoryResponse> => {
  const response = await axios.delete<DeleteCategoryResponse>(
    CategoryMapper.deleteCategory(input.categoryId),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data;
};