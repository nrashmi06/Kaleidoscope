import { getHashtagSuggestions } from '@/services/hashTag/hashtagService';

export interface HashtagSuggestion {
  hashtagId: number;
  name: string;
  usageCount: number;
}

export interface HashtagControllerResult {
  suggestions: HashtagSuggestion[];
  isLoading: boolean;
  error: string | null;
}

export function validateHashtagPrefix(prefix: string): boolean {
  return prefix.trim().length > 0;
}
/**
 * Fetch hashtag suggestions
 */
export async function fetchHashtagSuggestions(
  prefix: string,
  token: string,
  limit: number = 10
): Promise<HashtagControllerResult> {
  try {
    if (!prefix.trim()) {
      return { suggestions: [], isLoading: false, error: 'Enter at least one character' };
    }

    console.log('🔍 Fetching hashtag suggestions for:', prefix); // Debug log

    // Use the correct service function signature
    const response = await getHashtagSuggestions(prefix.trim(), token, 0, limit);
    
    console.log('📊 Hashtag API response:', response); // Debug log

    // Extract suggestions from the response
    const suggestions = response?.data?.content?.map((item: any) => ({
      hashtagId: item.hashtagId,
      name: item.name,
      usageCount: item.usageCount
    })) || [];

    console.log('✅ Mapped suggestions:', suggestions); // Debug log

    return { suggestions, isLoading: false, error: null };
  } catch (err) {
    console.error('❌ [HashtagController] Error fetching suggestions:', err);
    return { 
      suggestions: [],
      isLoading: false, 
      error: 'Failed to fetch hashtag suggestions' 
    };
  }
}

/**
 * Debounced fetcher for autocomplete
 */
export function debouncedHashtagSuggestions(
  prefix: string,
  token: string,
  callback: (result: HashtagControllerResult) => void,
  delay: number = 300
): () => void {
  let timeoutId: NodeJS.Timeout;

  const cleanup = () => clearTimeout(timeoutId);

  if (!prefix.trim()) {
    callback({ suggestions: [], isLoading: false, error: 'Enter at least one character' });
    return cleanup;
  }

  callback({ suggestions: [], isLoading: true, error: null });

  timeoutId = setTimeout(async () => {
    const result = await fetchHashtagSuggestions(prefix, token);
    callback(result);
  }, delay);

  return cleanup;
}
