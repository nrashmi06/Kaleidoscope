// src/lib/types/postFeed.ts

import type { StandardAPIResponse } from "./auth"; // Re-using global wrapper
import { Post } from "./post"; // Importing heavyweight Post type
import { CategorySummaryResponseDTO } from "./post"; // Import CategorySummaryResponseDTO

// --- API Response Types ---

export interface PostAuthor {
  userId: number;
  email: string;
  username: string;
  accountStatus: string;
  profilePictureUrl: string; // This type is correct (non-null)
}

// Re-export this type for userProfile.ts
export type { CategorySummaryResponseDTO };

/**
 * Represents a single Post item in the feed's 'content' array.
 * This is based on the provided API response schema.
 */
export interface PostFeedItem {
  postId: number;
  title: string;
  summary: string;
  visibility: "PUBLIC" | "FOLLOWERS";
  createdAt: string; // ISO date string
  author: PostAuthor;
  categories: CategorySummaryResponseDTO[];
  
  // ✅ *** THIS IS THE FIX ***
  // Changed from 'string' to 'string | null' to match the API response.
  thumbnailUrl: string | null; 
  
  hashtags: string[];
  reactionCount: number;
  commentCount: number;
  viewCount: number;
}

/**
 * Represents the 'data' object in a successful API response.
 */
export interface PaginatedPostsData {
  content: PostFeedItem[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

/**
 * The full, strictly-typed API response for GET /api/posts.
 */
export type PaginatedPostsResponse = StandardAPIResponse<PaginatedPostsData | null>;

// --- Controller & Component Types ---

// ✅ --- THIS IS THE MISSING INTERFACE ---
/**
 * Defines the available filter parameters for fetching posts.
 */
export interface PostFilterParams {
  q?: string;
  hashtag?: string;
  categoryId?: number;
  visibility?: "PUBLIC" | "FOLLOWERS" | string; // string allows for 'all'
  page?: number;
  size?: number;
  sort?: string[];
  locationId?: number;
  userId?: number;
}
// --- END OF FIX ---


/**
 * A normalized Post item for the UI, with formatted dates.
 */
export interface NormalizedPostFeedItem extends Omit<PostFeedItem, "createdAt"> {
  createdAt: Date;
  formattedCreatedAt: string; // e.g., "5 hours ago"
}

/**
 * Normalized pagination info for UI components.
 */
export interface NormalizedPagination {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * The final, normalized shape returned by the controller for the component.
 */
export interface PostFeedControllerResult {
  success: boolean;
  posts: NormalizedPostFeedItem[];
  pagination: NormalizedPagination;
  error?: string;
}

/**
 * Adapter function to map the new API response (NormalizedPostFeedItem)
 * to the shape your existing <SocialPostCard> expects (Post).
 */
export function mapFeedItemToPost(item: NormalizedPostFeedItem): Post {
  return {
    // Fields from NormalizedPostFeedItem
    postId: item.postId,
    title: item.title,
    summary: item.summary,
    visibility: item.visibility,
    createdAt: item.createdAt.toISOString(),
    author: {
      userId: item.author.userId,
      username: item.author.username,
      profilePictureUrl: item.author.profilePictureUrl,
    },
    categories: item.categories,
    thumbnailUrl: item.thumbnailUrl ?? undefined, // Handle null
    hashtags: item.hashtags,
    reactionCount: item.reactionCount,
    commentCount: item.commentCount,
    viewCount: item.viewCount,

    // Fields required by `Post` but not in `PostFeedItem`
    // We provide safe defaults.
    body: item.summary, // Use summary as fallback for body
    updatedAt: item.createdAt.toISOString(), // Use createdAt as fallback
    mediaDetails: item.thumbnailUrl
      ? [
          {
            url: item.thumbnailUrl,
            mediaType: "IMAGE",
            position: 0,
            width: 0,
            height: 0,
            fileSizeKb: 0,
          },
        ]
      : [],
    taggedUsers: [],
    isLikedByCurrentUser: false, // Cannot know this from this endpoint
  };
}