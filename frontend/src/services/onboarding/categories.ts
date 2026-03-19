import { ParentCategoriesResponse } from "@/lib/types/settings/category";
import { CategoryMapper } from "@/mapper/categoryMapper";
import { UserInterestMapper } from "@/mapper/userInterestMapper";
import axiosInstance, { isAxiosError } from "@/hooks/axios";

// Get all parent categories for onboarding
export const getOnboardingCategories = async (accessToken: string): Promise<ParentCategoriesResponse> => {
  try {
    const response = await axiosInstance.get<ParentCategoriesResponse>(
      CategoryMapper.getAllCategories,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    if (isAxiosError(error)) {
      console.error("API Error Status:", error.response?.status);
      console.error("API Error Response:", error.response?.data);
    }
    throw error;
  }
};

// Add user interests in bulk for onboarding
export const addUserInterestsBulk = async (
  accessToken: string,
  categoryIds: number[]
): Promise<{ success: boolean; message: string }> => {
  const response = await axiosInstance.post(
    UserInterestMapper.addUserInterestsBulk,
    { categoryIds },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};
