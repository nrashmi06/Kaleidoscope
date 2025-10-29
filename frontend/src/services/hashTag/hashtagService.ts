import axios, { AxiosError } from "axios";
import { HashtagMapper } from "@/mapper/hashtagMapper";
import { HashtagSuggestionsResponse } from "@/lib/types/hashtag";

/**
 * Fetches hashtag suggestions based on a given prefix.
 * @param prefix - The prefix string to search for (e.g., 'java', 'spr')
 * @param accessToken - Optional access token for authenticated requests
 * @returns A structured HashtagSuggestionsResponse
 */
export const getHashtagSuggestions = async (
  prefix: string,
  accessToken?: string
): Promise<HashtagSuggestionsResponse> => {
  try {
    const response = await axios.get<HashtagSuggestionsResponse>(
      HashtagMapper.getHashtagSuggestions(prefix),
      {
        withCredentials: true, // in case backend uses cookies
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("[getHashtagSuggestions] Error:", error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<HashtagSuggestionsResponse>;
      return (
        axiosError.response?.data || {
          success: false,
          message: "Failed to fetch hashtag suggestions",
          errors: [axiosError.message],
          data: null,
          timestamp: Date.now(),
          path: `/api/hashtags/suggest`,
        }
      );
    }

    // Fallback for unexpected errors
    return {
      success: false,
      message: "Unexpected error fetching hashtag suggestions",
      errors: ["Unknown error"],
      data: null,
      timestamp: Date.now(),
      path: `/api/hashtags/suggest`,
    };
  }
};
