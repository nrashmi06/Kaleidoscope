import { 
  HashtagItem, 
  HashtagSuggestion,
  HashtagSuggestionsResponse 
} from '@/lib/types/hashtag';

/**
 * Maps a single hashtag item from API response to frontend format
 * @param hashtagItem - Raw hashtag data from API
 * @returns Mapped hashtag suggestion with safe defaults
 */
export function mapHashtagSuggestion(hashtagItem: HashtagItem): HashtagSuggestion {
  return {
    hashtagId: hashtagItem.hashtagId || 0,
    name: hashtagItem.name || '',
    usageCount: hashtagItem.usageCount || 0
  };
}

/**
 * Maps the complete API response to a clean array of hashtag suggestions
 * @param response - Complete API response
 * @returns Array of mapped hashtag suggestions, sorted by usage count descending
 */
export function mapHashtagSuggestions(response: HashtagSuggestionsResponse): HashtagSuggestion[] {
  if (!response.success || !response.data?.content) {
    return [];
  }

  return response.data.content
    .map(mapHashtagSuggestion)
    .sort((a, b) => b.usageCount - a.usageCount); // Sort by usage count descending
}

/**
 * Maps paginated hashtag response for frontend consumption
 * @param response - Complete API response with pagination
 * @returns Object containing mapped suggestions and pagination info
 */
export function mapPaginatedHashtagResponse(response: HashtagSuggestionsResponse) {
  const suggestions = mapHashtagSuggestions(response);
  
  const paginationInfo = response.data ? {
    page: response.data.page,
    size: response.data.size,
    totalPages: response.data.totalPages,
    totalElements: response.data.totalElements,
    first: response.data.first,
    last: response.data.last
  } : {
    page: 0,
    size: 0,
    totalPages: 0,
    totalElements: 0,
    first: true,
    last: true
  };

  return {
    suggestions,
    pagination: paginationInfo
  };
}

/**
 * Filters hashtag suggestions by prefix (client-side filtering if needed)
 * @param suggestions - Array of hashtag suggestions
 * @param prefix - Prefix to filter by
 * @returns Filtered suggestions that match the prefix
 */
export function filterHashtagsByPrefix(
  suggestions: HashtagSuggestion[], 
  prefix: string
): HashtagSuggestion[] {
  if (!prefix.trim()) {
    return suggestions;
  }

  const normalizedPrefix = prefix.toLowerCase().trim();
  return suggestions.filter(hashtag => 
    hashtag.name.toLowerCase().startsWith(normalizedPrefix)
  );
}

/**
 * Groups hashtags by usage count ranges for better categorization
 * @param suggestions - Array of hashtag suggestions
 * @returns Object with hashtags grouped by usage ranges
 */
export function groupHashtagsByUsage(suggestions: HashtagSuggestion[]) {
  const popular = suggestions.filter(h => h.usageCount >= 100);
  const moderate = suggestions.filter(h => h.usageCount >= 10 && h.usageCount < 100);
  const emerging = suggestions.filter(h => h.usageCount < 10);

  return {
    popular,
    moderate,
    emerging
  };
}

/**
 * Formats hashtag name for display (adds # prefix if not present)
 * @param name - Raw hashtag name
 * @returns Formatted hashtag name with # prefix
 */
export function formatHashtagName(name: string): string {
  if (!name) return '';
  return name.startsWith('#') ? name : `#${name}`;
}

/**
 * Formats usage count for display with appropriate suffixes
 * @param count - Usage count number
 * @returns Formatted string with K/M suffixes for large numbers
 */
export function formatUsageCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
