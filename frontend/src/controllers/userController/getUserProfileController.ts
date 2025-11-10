// src/controllers/userController/getUserProfileController.ts
import { getUserProfileService } from "@/services/user/userProfileService";
import { 
  UserProfileResponse, 
  MappedUserProfile, 
  UserProfileControllerResult,
  UserProfileDTO
} from "@/lib/types/userProfile";

// Constants for default values (Mapping/Normalization)
const DEFAULT_PROFILE_PIC = "/default-avatar.png";
const DEFAULT_COVER_PHOTO = "/default-cover.jpg";
const DEFAULT_SUMMARY = 'No summary provided.';
const DEFAULT_DESIGNATION = 'Member of Kaleidoscope';

/**
 * Controller function to fetch and process a user's profile.
 * Includes data normalization (mapping) logic.
 * * @param userId - The ID of the user whose profile to fetch.
 * @param accessToken - The viewer's JWT token.
 * @returns A structured result object.
 */
export async function getUserProfileController(
  userId: number,
  accessToken?: string
): Promise<UserProfileControllerResult> {
  
  if (!userId || userId <= 0) {
    return {
      success: false,
      message: 'Invalid user ID provided',
      errors: ['User ID must be a positive number'],
      statusCode: 400
    };
  }

  try {
    const response: UserProfileResponse = await getUserProfileService(userId, accessToken);

    if (!response.success || !response.data) {
      return {
        success: false,
        message: response.message || 'Failed to retrieve profile.',
        errors: response.errors || [],
        statusCode: 404
      };
    }

    const rawProfile: UserProfileDTO = response.data;

    // 🪄 Data Normalization/Mapping 
    const mappedProfile: MappedUserProfile = {
      userId: rawProfile.userId,
      username: rawProfile.username || 'Unknown User',
      profilePictureUrl: rawProfile.profilePictureUrl || DEFAULT_PROFILE_PIC,
      coverPhotoUrl: rawProfile.coverPhotoUrl || DEFAULT_COVER_PHOTO,
      summary: rawProfile.summary || DEFAULT_SUMMARY,
      designation: rawProfile.designation || DEFAULT_DESIGNATION,
      followerCount: rawProfile.followerCount || 0,
      followingCount: rawProfile.followingCount || 0,
      isPrivate: rawProfile.isPrivate || false,
      followStatus: rawProfile.followStatus || "NONE",
      posts: {
        ...rawProfile.posts,
        // Ensure thumbnail is normalized for each post
        content: rawProfile.posts.content.map(post => ({
            ...post,
            thumbnailUrl: post.thumbnailUrl || null,
        }))
      }
    };

    return {
      success: true,
      data: mappedProfile,
      message: response.message || 'Profile retrieved successfully',
      errors: [],
      statusCode: 200
    };
    
  } catch (error) {
    console.error(`[UserProfileController] Unexpected error fetching user ${userId}:`, error);
    
    return {
      success: false,
      message: 'An unexpected error occurred while loading the profile.',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      statusCode: 500
    };
  }
}