import { FollowMapper } from "@/mapper/followMapper";
import type { FollowResponse } from "@/lib/types/follow";

const followUserService = async (
  accessToken: string | null,
  targetUserId: number
): Promise<{ success: boolean; data?: FollowResponse; error?: string }> => {
  try {
    const url = FollowMapper.follow(targetUserId);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
    });

    const responseData = await res.json();
    if (!res.ok) {
      return { success: false, error: responseData?.message || "Failed to follow user" };
    }

    return { success: true, data: responseData as FollowResponse };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export default followUserService;
