import { 
  PaginatedTagResponse, 
  TagResponseDTO, 
  MappedTag, 
  MappedPaginatedTagResponse 
} from "@/lib/types/tag";

/**
 * Maps a single raw tag response to a frontend-friendly format
 */
export function mapTag(rawTag: TagResponseDTO, currentUserId?: number): MappedTag {
  // Helper function to safely parse dates
  const parseDate = (dateString: string): Date => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  // Helper function to format dates relative to now
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return "just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks}w ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const createdAt = parseDate(rawTag.createdAt);

  return {
    tagId: rawTag.tagId,
    taggedUser: {
      userId: rawTag.taggedUserId,
      username: rawTag.taggedUsername || 'Unknown User'
    },
    taggerUser: {
      userId: rawTag.taggerUserId,
      username: rawTag.taggerUsername || 'Unknown User'
    },
    contentType: rawTag.contentType,
    contentId: rawTag.contentId,
    createdAt,
    formattedCreatedAt: formatDate(createdAt),
    isCurrentUser: currentUserId ? rawTag.taggedUserId === currentUserId : undefined
  };
}

/**
 * Maps a paginated tag response to a frontend-friendly format
 */
export function mapPaginatedTagResponse(
  rawResponse: PaginatedTagResponse,
  currentUserId?: number
): MappedPaginatedTagResponse {
  return {
    tags: rawResponse.content.map(tag => mapTag(tag, currentUserId)),
    pagination: {
      page: rawResponse.page,
      size: rawResponse.size,
      totalPages: rawResponse.totalPages,
      totalElements: rawResponse.totalElements,
      hasNext: !rawResponse.last,
      hasPrevious: !rawResponse.first,
      isFirst: rawResponse.first,
      isLast: rawResponse.last
    }
  };
}

/**
 * Groups tags by tagger user for better display organization
 */
export function groupTagsByTagger(tags: MappedTag[]): Map<string, MappedTag[]> {
  const grouped = new Map<string, MappedTag[]>();
  
  tags.forEach(tag => {
    const taggerKey = `${tag.taggerUser.userId}-${tag.taggerUser.username}`;
    const existing = grouped.get(taggerKey) || [];
    existing.push(tag);
    grouped.set(taggerKey, existing);
  });

  return grouped;
}

/**
 * Gets unique tagged users from a list of tags
 */
export function getUniqueTaggedUsers(tags: MappedTag[]): Array<{ userId: number; username: string }> {
  const uniqueUsers = new Map<number, { userId: number; username: string }>();
  
  tags.forEach(tag => {
    if (!uniqueUsers.has(tag.taggedUser.userId)) {
      uniqueUsers.set(tag.taggedUser.userId, tag.taggedUser);
    }
  });

  return Array.from(uniqueUsers.values());
}

/**
 * Gets unique tagger users from a list of tags
 */
export function getUniqueTaggerUsers(tags: MappedTag[]): Array<{ userId: number; username: string }> {
  const uniqueUsers = new Map<number, { userId: number; username: string }>();
  
  tags.forEach(tag => {
    if (!uniqueUsers.has(tag.taggerUser.userId)) {
      uniqueUsers.set(tag.taggerUser.userId, tag.taggerUser);
    }
  });

  return Array.from(uniqueUsers.values());
}

/**
 * Filters tags to show only those tagged by the current user
 */
export function filterTagsByCurrentUserTagger(tags: MappedTag[], currentUserId: number): MappedTag[] {
  return tags.filter(tag => tag.taggerUser.userId === currentUserId);
}

/**
 * Filters tags to show only those where current user is tagged
 */
export function filterTagsForCurrentUser(tags: MappedTag[], currentUserId: number): MappedTag[] {
  return tags.filter(tag => tag.taggedUser.userId === currentUserId);
}
