// src/controllers/followRequests/getPendingFollowRequestsController.ts
import { getPendingFollowRequestsService } from "@/services/followRequests/getPendingFollowRequests";
import type { 
    GetPendingFollowRequestsResponse, 
    GetPendingFollowRequestsParams 
} from "@/lib/types/followRequests";

export const getPendingFollowRequestsController = async (
  accessToken: string | null,
  options?: GetPendingFollowRequestsParams
): Promise<{ success: boolean; data?: GetPendingFollowRequestsResponse; error?: string }> => {
  if (!accessToken) {
    return { success: false, error: "Access token is missing." };
  }
  
  // Service handles default sort, so we just pass options through
  return await getPendingFollowRequestsService(accessToken, options);
};