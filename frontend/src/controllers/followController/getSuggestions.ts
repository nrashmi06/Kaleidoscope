import getFollowSuggestionsService from "@/services/follow/getSuggestionsService";
import type { GetSuggestionsParams, GetSuggestionsResponse } from "@/lib/types/followSuggestions";

export const getFollowSuggestions = async (
  accessToken: string | null,
  options?: GetSuggestionsParams
): Promise<{ success: boolean; data?: GetSuggestionsResponse; error?: string }> => {
  return await getFollowSuggestionsService(accessToken, options);
};

const FollowSuggestionsController = { getFollowSuggestions };
export default FollowSuggestionsController;
