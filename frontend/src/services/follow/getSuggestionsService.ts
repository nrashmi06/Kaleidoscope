import FollowMapper from "@/mapper/followMapper";
import type { GetSuggestionsResponse, GetSuggestionsParams } from "@/lib/types/followSuggestions";
// ✅ 1. Import axios instance and error types
import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";

const getFollowSuggestionsService = async (
  accessToken: string | null,
  options: GetSuggestionsParams = {} // ✅ Default options to empty object
): Promise<{ success: boolean; data?: GetSuggestionsResponse; error?: string }> => {
  try {
    // ✅ 2. Token check (same as before)
    if (!accessToken) {
      return { success: false, error: "Authentication token is missing." };
    }

    const base = FollowMapper.suggestions();

    // ✅ 3. Define axios config for headers and params
    const config = {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      // Axios will automatically build the query string from this object
      // and will ignore undefined/null values.
      params: {
        userId: options.userId,
        page: options.page,
        size: options.size,
        sort: options.sort,
      },
    };

    // ✅ 4. Call axiosInstance.get instead of fetch
    const response = await axiosInstance.get<GetSuggestionsResponse>(base, config);

    const responseData = response.data;

    // ✅ 5. Check backend-defined success flag
    if (!responseData.success) {
      return { success: false, error: responseData?.message || "Failed to fetch suggestions" };
    }

    // Return the full API response object
    return { success: true, data: responseData };

  } catch (err) {
    // ✅ 6. Use isAxiosError to handle non-2xx responses
    if (isAxiosError(err)) {
      const error = err as AxiosError<GetSuggestionsResponse>;
      const responseData = error.response?.data;

      if (error.response?.status === 401) {
        return { success: false, error: "Unauthorized. Please log in again." };
      }
      
      // General axios error
      return { success: false, error: responseData?.message || `HTTP ${error.response?.status}: Failed to fetch suggestions` };
    }

    // Fallback for non-network errors
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export default getFollowSuggestionsService;