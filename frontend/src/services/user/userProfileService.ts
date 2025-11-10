// src/services/user/userProfileService.ts
import { UserMapper } from "@/mapper/userMapper";
import { UserProfileResponse } from "@/lib/types/userProfile";

/**
 * Fetches a user's profile, including their recent posts and follow status.
 * @param userId - The ID of the user whose profile to retrieve.
 * @param accessToken - The viewer's JWT token for authentication.
 * @returns Promise resolving to the raw UserProfileResponse.
 */
export async function getUserProfileService(
  userId: number,
  accessToken?: string
): Promise<UserProfileResponse> {
  const url = UserMapper.getUserProfile(userId);

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store', 
    });

    const responseData: UserProfileResponse = await response.json();

    if (!response.ok) {
        // Use backend error response if available, otherwise construct one.
        const errorMessage = responseData.message || `HTTP ${response.status}: Failed to fetch profile`;
        const errors = responseData.errors || [errorMessage];

        return {
            ...responseData,
            success: false,
            message: errorMessage,
            errors: errors,
            data: null,
            timestamp: Date.now(),
            path: url,
        };
    }

    return responseData;

  } catch (error) {
    console.error(`[UserProfileService] Error fetching profile for user ${userId}:`, error);
    
    return {
      success: false,
      message: 'Network error: Unable to connect to server',
      data: null,
      errors: [error instanceof Error ? error.message : 'Unknown network error'],
      timestamp: Date.now(),
      path: UserMapper.getUserProfile(userId),
    };
  }
}