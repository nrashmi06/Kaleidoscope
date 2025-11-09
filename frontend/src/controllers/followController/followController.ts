import followUserService from "@/services/follow/followService";
import unfollowUserService from "@/services/follow/unfollowService";
import type { FollowResponse, UnfollowResponse } from "@/lib/types/follow";

export const followUser = async (
  accessToken: string | null,
  targetUserId: number
): Promise<{ success: boolean; data?: FollowResponse; error?: string }> => {
  return await followUserService(accessToken, targetUserId);
};

export const unfollowUser = async (
  accessToken: string | null,
  targetUserId: number
): Promise<{ success: boolean; data?: UnfollowResponse; error?: string }> => {
  return await unfollowUserService(accessToken, targetUserId);
};

const FollowController = { followUser, unfollowUser };
export default FollowController;
