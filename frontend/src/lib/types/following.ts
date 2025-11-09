import { StandardAPIResponse } from "@/lib/types/auth";
import type { SuggestedUser } from "@/lib/types/followSuggestions";

export interface FollowingPage {
  users: SuggestedUser[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

export type GetFollowingResponse = StandardAPIResponse<FollowingPage>;

export interface GetFollowingParams {
  userId: number;
  page?: number;
  size?: number;
}
