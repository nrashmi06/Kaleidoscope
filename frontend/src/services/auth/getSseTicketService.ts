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
    const response = await axiosInstance.post<SseTicketApiResponse>(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    // Quiet log — SSE ticket failures are non-critical and retried automatically
    if (process.env.NODE_ENV !== "production") {
      const msg = isAxiosError(error)
        ? `${(error as AxiosError).response?.status ?? "network"} — ${(error as AxiosError).message}`
        : (error instanceof Error ? error.message : "Unknown error");
      console.debug("[SSE ticket] Could not obtain ticket:", msg);
    }

    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<SseTicketApiResponse>;
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
    }

    return {
      success: false,
      message: "Failed to obtain SSE ticket.",
      data: null,
      errors: [error instanceof Error ? error.message : "Unknown error"],
      timestamp: Date.now(),
      path: url,
    };
  }
};