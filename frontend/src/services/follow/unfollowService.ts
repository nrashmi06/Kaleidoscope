import FollowMapper from "@/mapper/followMapper";
import type { UnfollowResponse } from "@/lib/types/follow";

const unfollowUserService = async (
  accessToken: string | null,
  targetUserId: number
): Promise<{ success: boolean; data?: UnfollowResponse; error?: string }> => {
  try {
    const url = FollowMapper.unfollow(targetUserId);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers,
    });

    const responseData = await res.json();
    if (!res.ok) {
      return { success: false, error: responseData?.message || "Failed to unfollow user" };
    }

    return { success: true, data: responseData as UnfollowResponse };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export default unfollowUserService;
