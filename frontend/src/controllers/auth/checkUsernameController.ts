// src/controllers/auth/checkUsernameController.ts
import { checkUsernameService } from "@/services/auth/checkUsernameService";
import type { UsernameCheckPayload, UsernameCheckAPIResponse } from "@/lib/types/usernameCheck";

export async function checkUsernameController(username: string): Promise<UsernameCheckAPIResponse> {
  const checkEndpoint = "/api/auth/username/check";
  const defaultPayload: UsernameCheckPayload = { available: false, username };

  try {
    if (!username || username.trim() === "") {
      return {
        success: true, // Treat as success for initial/empty state
        message: "Username is empty.",
        data: defaultPayload, // Must provide data payload
        errors: [],
        timestamp: Date.now(),
        path: checkEndpoint,
      } as UsernameCheckAPIResponse;
    }

    // Basic client-side validation
    if (!/^[a-zA-Z0-9_]{3,}$/.test(username)) {
         return {
            success: false,
            message: "Username must be 3+ chars and contain only letters, numbers, or underscores.",
            data: defaultPayload, 
            errors: ["Invalid format"],
            timestamp: Date.now(),
            path: checkEndpoint,
        } as UsernameCheckAPIResponse;
    }

    const response = await checkUsernameService(username);
    
    // Ensure success paths always contain data, even if it wasn't strictly necessary.
    if (response.success && !response.data) {
        return {
            ...response,
            data: defaultPayload,
        } as UsernameCheckAPIResponse;
    }
    
    return response;
  } catch (error) {
    console.error("Username check failed:", error);
    return {
      success: false,
      message: "Failed to check username availability",
      data: defaultPayload, 
      errors: [String(error)],
      timestamp: Date.now(),
      path: checkEndpoint,
    } as UsernameCheckAPIResponse;
  }
}