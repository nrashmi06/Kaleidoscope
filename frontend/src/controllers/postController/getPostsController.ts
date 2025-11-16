// src/controllers/postController/getPostsController.ts
import { filterPostsService } from "@/services/post/filterPosts";
import type { 
  PostFilterParams,
  PostFeedControllerResult,
  NormalizedPostFeedItem,
  NormalizedPagination,
  PostFeedItem
} from "@/lib/types/postFeed";
import { formatDistanceToNow } from 'date-fns';

// Default pagination for empty or error states
const defaultPagination: NormalizedPagination = {
  currentPage: 0,
  totalPages: 0,
  totalElements: 0,
  size: 10,
  isFirst: true,
  isLast: true,
};

/**
 * Normalizes a raw PostFeedItem from the API into a UI-ready object.
 * @param post - The raw post item.
 * @returns A normalized post item with formatted dates.
 */
function normalizePost(post: PostFeedItem): NormalizedPostFeedItem {
  
  // --- START OF FIX ---
  // Check if the date string already has timezone info (Z or +/-HH:mm)
  const dateString = post.createdAt;
  const hasTimezoneInfo = /Z|[+-]\d{2}:\d{2}$/.test(dateString);
  // If not, append 'Z' to force it to be parsed as UTC
  const createdAt = new Date(hasTimezoneInfo ? dateString : dateString + 'Z');
  // --- END OF FIX ---

  const formattedCreatedAt = formatDistanceToNow(createdAt, { addSuffix: true });

  return {
    ...post,
    createdAt: createdAt,
    formattedCreatedAt: formattedCreatedAt,
    // Ensure author has a fallback profile picture
    author: {
        ...post.author,
        profilePictureUrl: post.author.profilePictureUrl || '/default-avatar.png'
    },
    // Ensure thumbnail has a fallback (or is null)
    thumbnailUrl: post.thumbnailUrl || '/default-cover.jpg' // Or null if you prefer
  };
}

/**
 * Fetches, filters, and normalizes paginated posts for the feed component.
 * @param accessToken - The user's JWT.
 * @param filters - The filter parameters.
 * @returns A promise resolving to a normalized result for the UI.
 */
export const getPostsController = async (
  accessToken: string,
  filters: PostFilterParams
): Promise<PostFeedControllerResult> => {
  
  // Ensure default sorting if none is provided
  const queryFilters: PostFilterParams = {
    sort: ['createdAt,desc'],
    ...filters,
  };

  try {
    const response = await filterPostsService(accessToken, queryFilters);

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to load posts");
    }

    const { data } = response;
    const normalizedPosts = data.content.map(normalizePost);

    return {
      success: true,
      posts: normalizedPosts,
      pagination: {
        currentPage: data.page,
        totalPages: data.totalPages,
        totalElements: data.totalElements,
        size: data.size,
        isFirst: data.first,
        isLast: data.last,
      },
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return {
      success: false,
      posts: [],
      pagination: defaultPagination,
      error: errorMessage,
    };
  }
};