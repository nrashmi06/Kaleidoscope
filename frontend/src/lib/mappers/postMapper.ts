import { SinglePostResponseDTO } from "@/lib/types/post";

export interface MappedSinglePost {
  postId: number;
  title: string;
  body: string;
  summary: string;
  visibility: "PUBLIC" | "FOLLOWERS";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: Date;
  updatedAt: Date;
  author: {
    userId: number;
    email: string;
    username: string;
    accountStatus: string;
    profilePictureUrl: string;
  };
  categories: Array<{
    categoryId: number;
    name: string;
  }>;
  media: Array<{
    mediaId: number;
    mediaUrl: string;
    mediaType: "IMAGE";
    position: number;
    width: number;
    height: number;
    fileSizeKb: number;
    durationSeconds: number | null;
    extraMetadata: Record<string, unknown>;
    createdAt: Date;
  }>;
  location: {
    locationId: number;
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    state: string;
    city: string;
    address: string;
    placeId: string;
    createdAt: Date;
  } | null;
  taggedUsers: Array<{
    tagId: number;
    taggedUserId: number;
    taggedUsername: string;
    taggerUserId: number;
    taggerUsername: string;
    contentType: string;
    contentId: number;
    createdAt: Date;
  }>;
  hashtags: string[];
  reactionCount: number;
  commentCount: number;
  viewCount: number;
  currentUserReaction: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  displaySummary: string;
  primaryMediaUrl: string | null;
}

/**
 * Maps raw single post response data to a clean, frontend-friendly format
 */
export function mapSinglePost(rawPost: SinglePostResponseDTO): MappedSinglePost {
  // Helper function to safely parse dates
  const parseDate = (dateString: string): Date => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  // Helper function to format dates
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Parse dates
  const createdAt = parseDate(rawPost.createdAt);
  const updatedAt = parseDate(rawPost.updatedAt);

  // Get primary media URL (first image or fallback)
  const primaryMediaUrl = rawPost.media.length > 0 
    ? rawPost.media.sort((a, b) => a.position - b.position)[0]?.mediaUrl || null
    : null;

  // Trim summary if too long
  const displaySummary = rawPost.summary?.length > 150 
    ? `${rawPost.summary.substring(0, 150)}...` 
    : rawPost.summary || '';

  return {
    postId: rawPost.postId,
    title: rawPost.title || 'Untitled Post',
    body: rawPost.body || '',
    summary: rawPost.summary || '',
    visibility: rawPost.visibility,
    status: rawPost.status,
    createdAt,
    updatedAt,
    author: {
      userId: rawPost.author.userId,
      email: rawPost.author.email || '',
      username: rawPost.author.username || 'Unknown User',
      accountStatus: rawPost.author.accountStatus || 'UNKNOWN',
      profilePictureUrl: rawPost.author.profilePictureUrl || '/default-avatar.png'
    },
    categories: rawPost.categories.map(cat => ({
      categoryId: cat.categoryId,
      name: cat.name || 'Uncategorized'
    })),
    media: rawPost.media.map(media => ({
      mediaId: media.mediaId,
      mediaUrl: media.mediaUrl || '',
      mediaType: media.mediaType,
      position: media.position || 0,
      width: media.width || 0,
      height: media.height || 0,
      fileSizeKb: media.fileSizeKb || 0,
      durationSeconds: media.durationSeconds || null,
      extraMetadata: media.extraMetadata || {},
      createdAt: parseDate(media.createdAt)
    })),
    location: rawPost.location ? {
      locationId: rawPost.location.locationId,
      name: rawPost.location.name || 'Unknown Location',
      latitude: rawPost.location.latitude || 0,
      longitude: rawPost.location.longitude || 0,
      country: rawPost.location.country || '',
      state: rawPost.location.state || '',
      city: rawPost.location.city || '',
      address: rawPost.location.address || '',
      placeId: rawPost.location.placeId || '',
      createdAt: parseDate(rawPost.location.createdAt)
    } : null,
    taggedUsers: rawPost.taggedUsers.map(tag => ({
      tagId: tag.tagId,
      taggedUserId: tag.taggedUserId,
      taggedUsername: tag.taggedUsername || 'Unknown User',
      taggerUserId: tag.taggerUserId,
      taggerUsername: tag.taggerUsername || 'Unknown User',
      contentType: tag.contentType,
      contentId: tag.contentId,
      createdAt: parseDate(tag.createdAt)
    })),
    hashtags: rawPost.hashtags || [],
    reactionCount: rawPost.reactionCount || 0,
    commentCount: rawPost.commentCount || 0,
    viewCount: rawPost.viewCount || 0,
    currentUserReaction: rawPost.currentUserReaction,
    formattedCreatedAt: formatDate(createdAt),
    formattedUpdatedAt: formatDate(updatedAt),
    displaySummary,
    primaryMediaUrl
  };
}
