// src/services/auth/checkUsernameService.ts
import type { UsernameCheckPayload, UsernameCheckAPIResponse } from "@/lib/types/usernameCheck";
import { AuthMapper } from "@/mapper/authMapper";
import axios from "axios";

export async function checkUsernameService(username: string): Promise<UsernameCheckAPIResponse> {
  const endpoint = `${AuthMapper.checkUsername}?username=${encodeURIComponent(username)}`;
  const defaultPayload: UsernameCheckPayload = { available: false, username };

  try {
    const res = await axios.get<UsernameCheckAPIResponse>(endpoint, {
      headers: { "Content-Type": "application/json" },
    });

    return res.data;

  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const data = error.response.data as UsernameCheckAPIResponse;
      return {
        success: false,
        message: data.message || `HTTP ${error.response.status} error`,
        data: data.data || defaultPayload,
        errors: data.errors || [],
        timestamp: data.timestamp || Date.now(),
        path: data.path || endpoint,
      } as UsernameCheckAPIResponse;
    }

    console.error("Error checking username availability:", error);
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