// src/lib/types/usernameCheck.ts
import { StandardAPIResponse } from "@/lib/types/auth"; 

/**
 * The data payload returned by the username check API.
 */
export interface UsernameCheckPayload {
  available: boolean;
  username: string;
}

/**
 * The final API response type, strictly using the StandardAPIResponse structure.
 */
export type UsernameCheckAPIResponse = StandardAPIResponse<UsernameCheckPayload>;