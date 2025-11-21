
import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";
import { HashtagSuggestionsResponse } from "@/lib/types/hashtag";
import { HashtagMapper } from "@/mapper/hashtagMapper";


/**
 * Fetch hashtag suggestions
 * @param prefix - Hashtag prefix to search for
 * @param token - Bearer token for authorization
 * @param page - Page number (default: 0)
 * @param size - Page size (default: 10)
 */
export async function getHashtagSuggestions(
  prefix: string,
  token: string | null, // ✅ Updated to allow null
  page: number = 0,
  size: number = 10
): Promise<HashtagSuggestionsResponse> { // ✅ Added explicit return type
  
  if (!token) {
    throw new Error("Authentication token is missing.");
  }
  if (!prefix?.trim()) {
    throw new Error('Prefix is required');
  }


  try {
    // ✅ 3. Use axiosInstance.get
    const response = await axiosInstance.get<HashtagSuggestionsResponse>(HashtagMapper.getHashtagSuggestions(prefix.trim()), {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      // ✅ 4. Use axios params object for clean query string generation
      params: {
        page: page,
        size: size,
      }
    });

    const data = response.data;

    // ✅ 5. Check for backend-defined success flag
    if (!data?.success) {
      throw new Error(data?.message || 'Failed to fetch hashtag suggestions');
    }

    return data;

  } catch (error) {
    // ✅ 6. Handle axios-specific errors
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<HashtagSuggestionsResponse>;
      const errorData = axiosError.response?.data;
      throw new Error(errorData?.message || `Request failed with status ${axiosError.response?.status}`);
    }

    // Fallback for non-Axios errors
    throw error;
  }
}