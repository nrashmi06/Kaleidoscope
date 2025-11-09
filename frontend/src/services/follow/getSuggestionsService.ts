import FollowMapper from "@/mapper/followMapper";
import type { GetSuggestionsResponse, GetSuggestionsParams } from "@/lib/types/followSuggestions";

const getFollowSuggestionsService = async (
  accessToken: string | null,
  options?: GetSuggestionsParams
): Promise<{ success: boolean; data?: GetSuggestionsResponse; error?: string }> => {
  try {
    const base = FollowMapper.suggestions();
    const params = new URLSearchParams();

    if (options?.userId !== undefined && options.userId !== null) params.append("userId", String(options.userId));
    if (options?.page !== undefined) params.append("page", String(options.page));
    if (options?.size !== undefined) params.append("size", String(options.size));
    if (options?.sort) params.append("sort", options.sort);

    const url = params.toString() ? `${base}?${params.toString()}` : base;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "GET", headers });
    const responseData = await res.json();
    if (!res.ok) {
      return { success: false, error: responseData?.message || "Failed to fetch suggestions" };
    }

    return { success: true, data: responseData as GetSuggestionsResponse };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export default getFollowSuggestionsService;
