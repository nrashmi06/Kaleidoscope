import getFollowingService from "@/services/follow/getFollowingService";
import type { GetFollowingParams, GetFollowingResponse } from "@/lib/types/following";

export const getFollowing = async (
  accessToken: string | null,
  params: GetFollowingParams
): Promise<{ success: boolean; data?: GetFollowingResponse; error?: string }> => {
  return await getFollowingService(accessToken, params);
};

const FollowingController = { getFollowing };
export default FollowingController;
