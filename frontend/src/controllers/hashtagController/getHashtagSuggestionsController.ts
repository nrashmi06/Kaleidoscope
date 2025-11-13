import { getHashtagSuggestions } from "@/services/hashTag/hashtagService";
import { HashtagItem } from "@/lib/types/hashtag";

/**
 * Controller: Get hashtag suggestions for a given prefix.
 */
export const getHashtagSuggestionsController = async (
  prefix: string,
  accessToken?: string | null
): Promise<string[]> => {
  try {
    // ✅ FIX: Use 'accessToken || null' to convert any
    // undefined value to null, matching the service's type.
    const response = await getHashtagSuggestions(prefix, accessToken || null);

    if (!response.success) {
      console.warn(
        "[getHashtagSuggestionsController] API responded with failure:",
        response.message
      );
      return [];
    }

    if (!response.data || !Array.isArray(response.data.content)) {
      console.warn(
        "[getHashtagSuggestionsController] No hashtag content found."
      );
      return [];
    }

    // ✅ Return only hashtag names (e.g. ["javascript", "springboot"])
    return response.data.content.map((item: HashtagItem) => item.name);
  } catch (error) {
    // The service throws an error if the token is null,
    // so this catch block will handle it gracefully.
    console.error("[getHashtagSuggestionsController] Unexpected error:", error);
    return [];
  }
};