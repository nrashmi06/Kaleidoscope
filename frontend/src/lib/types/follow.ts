import { StandardAPIResponse } from "@/lib/types/auth";

// Response type for POST /follows?targetUserId={id}
export type FollowResponse = StandardAPIResponse<string>;

export interface FollowParams {
  targetUserId: number;
}

export type UnfollowResponse = StandardAPIResponse<string>;

