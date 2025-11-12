// src/controllers/userController/getUserProfileController.ts

import { getUserProfileService } from "@/services/user/userProfileService";
import {
  type UserProfileApiResponse,
  type MappedUserProfile,
  type UserProfileControllerResult,
  type UserPost, // ✅ 1. Import the source post type
} from "@/lib/types/userProfile";
import {
  type NormalizedPostFeedItem, // ✅ 2. Import the target post type
  type PostAuthor,
} from "@/lib/types/postFeed";
import { formatDistanceToNow } from "date-fns";

/**
 * Controller to fetch and map a user's profile.
 */
export const getUserProfileController = async (
  userId: number,
  accessToken?: string
): Promise<UserProfileControllerResult> => {
  try {
    const response: UserProfileApiResponse = await getUserProfileService(
      userId,
      accessToken
    );

    if (response.success && response.data) {
      // ✅ 3. --- MAPPING LOGIC IS ADDED HERE ---
      const dto = response.data;

      const normalizedPosts: NormalizedPostFeedItem[] = dto.posts.content.map(
        (post: UserPost) => {
          const createdAtDate = new Date(post.createdAt);

          // Fix the 'author' object
          const mappedAuthor: PostAuthor = {
            userId: post.author.userId,
            username: post.author.username,
            // FIX: Provide a default avatar if the URL is null
            profilePictureUrl:
              post.author.profilePictureUrl || "/default-avatar.png",
            email: post.author.email || "", // Handle null email
            accountStatus: post.author.accountStatus || "UNKNOWN", // Handle null status
          };

          return {
            ...post, // Spread all matching properties (postId, title, etc.)
            
            // --- Overwrite the mismatched properties ---
            author: mappedAuthor,
            
            // FIX: Treat 'PUBLIC' as 'PUBLIC' and everything else as 'FOLLOWERS'
            visibility: post.visibility === "PUBLIC" ? "PUBLIC" : "FOLLOWERS",
            
            // Add the Date object and formatted string
            createdAt: createdAtDate,
            formattedCreatedAt: formatDistanceToNow(createdAtDate, {
              addSuffix: true,
            }),
          };
        }
      );

      // Create the final MappedUserProfile
      const mappedData: MappedUserProfile = {
        userId: dto.userId,
        username: dto.username,
        profilePictureUrl: dto.profilePictureUrl,
        coverPhotoUrl: dto.coverPhotoUrl,
        summary: dto.summary,
        designation: dto.designation,
        followerCount: dto.followerCount,
        followingCount: dto.followingCount,
        isPrivate: dto.isPrivate,
        followStatus: dto.followStatus,
        posts: {
          ...dto.posts, // Spread pagination info (page, size, etc.)
          content: normalizedPosts, // Use our newly mapped content
        },
      };
      // --- END OF MAPPING LOGIC ---

      return {
        success: true,
        data: mappedData, // Return the mapped data
      };
    } else {
      return {
        success: false,
        data: null,
        message: response.message || "Failed to retrieve profile data.",
      };
    }
  } catch (error) {
    console.error("Error in getUserProfileController:", error);
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : "An unknown error occurred.",
    };
  }
};