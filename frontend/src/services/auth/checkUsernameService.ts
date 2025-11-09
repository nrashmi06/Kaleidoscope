// src/services/auth/checkUsernameService.ts
import type { UsernameCheckPayload, UsernameCheckAPIResponse } from "@/lib/types/usernameCheck";
import { AuthMapper } from "@/mapper/authMapper"; 

export async function checkUsernameService(username: string): Promise<UsernameCheckAPIResponse> {
  const endpoint = `${AuthMapper.checkUsername}?username=${encodeURIComponent(username)}`;
  // Default payload used when a network error prevents parsing the full response.
  const defaultPayload: UsernameCheckPayload = { available: false, username }; 

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data: UsernameCheckAPIResponse = await res.json();
    
    if (!res.ok) {
        // If data is missing from the API's error body (which shouldn't happen based on your example), 
        // we insert the default payload to maintain type integrity.
        return {
            success: false,
            message: data.message || `HTTP ${res.status} error`,
            data: data.data || defaultPayload, 
            errors: data.errors || [],
            timestamp: data.timestamp || Date.now(),
            path: data.path || endpoint,
        } as UsernameCheckAPIResponse;
    }
    
    return data;

  } catch (error) {
    console.error("Error checking username availability:", error);
    // Fabricate a full failure response that adheres to the strict type
    return {
      success: false,
      message: "Network error checking username availability",
      data: defaultPayload, 
      errors: [String(error)],
      timestamp: Date.now(),
      path: endpoint,
    } as UsernameCheckAPIResponse;
  }
}