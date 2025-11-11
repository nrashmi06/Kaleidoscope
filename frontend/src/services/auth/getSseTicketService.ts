// src/services/auth/getSseTicketService.ts

// ✅ 1. Import from your custom axios hook, not the base 'axios' package
import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";
import { AuthMapper } from "@/mapper/authMapper";
import type { SseTicketApiResponse } from "@/lib/types/sseTicket";

/**
 * Calls the API to get a one-time SSE ticket.
 *
 * @param accessToken - The authenticated user's JWT.
 * @returns The full API response (SseTicketApiResponse).
 */
export const getSseTicketService = async (
  accessToken: string
): Promise<SseTicketApiResponse> => {
  const url = AuthMapper.sseTicket;

  try {
    // ✅ 2. Use 'axiosInstance' here instead of 'axios.post'
    const response = await axiosInstance.post<SseTicketApiResponse>(
      url,
      {}, // Empty body for a POST request
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("[getSseTicketService] Error:", error);

    // ✅ 3. The 'isAxiosError' check is still correct
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<SseTicketApiResponse>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
    }

    return {
      success: false,
      message: "Failed to obtain SSE ticket. Please try again.",
      data: null,
      errors: [error instanceof Error ? error.message : "Unknown error"],
      timestamp: Date.now(),
      path: url,
    };
  }
};