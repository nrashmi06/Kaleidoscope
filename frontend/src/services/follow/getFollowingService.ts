import FollowMapper from "@/mapper/followMapper";
import type { GetFollowingResponse, GetFollowingParams } from "@/lib/types/following";

const getFollowingService = async (
  accessToken: string | null,
  params: GetFollowingParams
): Promise<{ success: boolean; data?: GetFollowingResponse; error?: string }> => {
  try {
    const base = FollowMapper.following();
    const search = new URLSearchParams();

    search.append("userId", String(params.userId));
    if (params.page !== undefined) search.append("page", String(params.page));
    if (params.size !== undefined) search.append("size", String(params.size));

    const url = `${base}?${search.toString()}`;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, { method: "GET", headers });
    const responseData = await res.json();
    if (!res.ok) return { success: false, error: responseData?.message || "Failed to fetch following" };

    return { success: true, data: responseData as GetFollowingResponse };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export default getFollowingService;
