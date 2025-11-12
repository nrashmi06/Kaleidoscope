import axios from "axios";
import { ParentCategoriesResponse } from "@/lib/types/settings/category";
import { CategoryMapper } from "@/mapper/categoryMapper";
import axiosInstance from "@/hooks/axios";

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
    if (axios.isAxiosError(error)) {
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
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/kaleidoscope/api/users/interests/bulk`,
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
