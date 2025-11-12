
import { UpdateCategoryData, UpdateCategoryResponse } from "@/lib/types/settings/category";
import { CategoryMapper } from "@/mapper/categoryMapper";
import axiosInstance from "@/hooks/axios";

export const updateCategory = async (
  categoryId: number,
  input: UpdateCategoryData,
  accessToken: string
): Promise<UpdateCategoryResponse> => {
  const response = await axiosInstance.put<UpdateCategoryResponse>(
    CategoryMapper.updateCategory(categoryId),
    input,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data;
};
