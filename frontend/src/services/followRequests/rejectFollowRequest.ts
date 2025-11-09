// src/services/followRequests/rejectFollowRequest.ts
import FollowMapper from "@/mapper/followMapper";
import type { FollowRequestActionResponse } from "@/lib/types/followRequests";

/**
 * Sends a DELETE request to reject a pending follow request.
 *
 * @param accessToken - The user's authentication token.
 * @param requesterUserId - The ID of the user who sent the follow request.
 * @returns A structured result indicating success or failure.
 */
export const rejectFollowRequestService = async (
  accessToken: string | null,
  requesterUserId: number
): Promise<{ success: boolean; data?: FollowRequestActionResponse; error?: string }> => {
  try {
    if (!accessToken) {
      return { success: false, error: "Authentication token is missing." };
    }
    
    // Endpoint: /api/follows/requests/reject?requesterUserId={id}
    const base = FollowMapper.rejectRequest();
    const url = `${base}?requesterUserId=${requesterUserId}`;

    const headers: Record<string, string> = { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}` 
    };

    // Use DELETE method as required by API details
    const res = await fetch(url, { 
      method: "DELETE", 
      headers,
    });

    const responseData = await res.json();
    
    if (!res.ok) {
        // Handle 401, 404, or other errors gracefully
        if (res.status === 401) {
            return { success: false, error: "Unauthorized access or invalid token." };
        }
        if (res.status === 404 && responseData?.message === "Follow request not found") {
            return { success: false, error: "The pending follow request was not found." };
        }
        return { success: false, error: responseData?.message || `HTTP ${res.status}: Failed to reject follow request` };
    }

    return { success: true, data: responseData as FollowRequestActionResponse };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
};