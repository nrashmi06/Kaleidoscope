// src/services/user/updateUserProfileService.ts (Corrected)
import { UserMapper } from "@/mapper/userMapper";
import { UserProfileUpdateResponse } from "@/lib/types/userProfileUpdate";
import axios, { AxiosError } from "axios";
import axiosInstance from "@/hooks/axios";

/**
 * Sends a PUT request to update the user's profile using multipart/form-data.
 * @param token - The authenticated user's JWT token.
 * @param formData - FormData object containing profilePicture, coverPhoto, and userData blob.
 * @returns Promise resolving to the raw UserProfileUpdateResponse.
 */
export async function updateUserProfileService(
  token: string,
  formData: FormData
): Promise<UserProfileUpdateResponse> {
  const url = UserMapper.updateUserProfileDetails;

  try {
    const response = await axiosInstance.put<UserProfileUpdateResponse>(
      url,
      formData,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(`[UserProfileService] Error updating profile:`, error);
    
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<UserProfileUpdateResponse>;
        const errorResponse = axiosError.response?.data;
        
        return {
            success: false,
            message: errorResponse?.message || `HTTP ${axiosError.response?.status} Error`,
            data: null,
            errors: errorResponse?.errors || [axiosError.message],
            timestamp: Date.now(),
            path: url,
        };
    }
    
    return {
      success: false,
      message: 'Network error: Unable to connect to server',
      data: null,
      errors: [error instanceof Error ? error.message : 'Unknown network error'],
      timestamp: Date.now(),
      path: url,
    };
  }
}