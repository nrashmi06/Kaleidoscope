// src/controllers/auth/getSseTicketController.ts

import { getSseTicketService } from "@/services/auth/getSseTicketService";
import type { SseTicketControllerResult } from "@/lib/types/sseTicket";

/**
 * Controller to handle the logic for retrieving an SSE ticket.
 *
 * @param accessToken - The authenticated user's JWT.
 * @returns A normalized result (SseTicketControllerResult) for the frontend.
 */
export const getSseTicketController = async (
  accessToken: string
): Promise<SseTicketControllerResult> => {
  
  if (!accessToken) {
    return { success: false, message: "Authentication token is missing." };
  }

  try {
    const response = await getSseTicketService(accessToken);

    if (response.success && response.data?.ticket) {
      return {
        success: true,
        message: response.message || "SSE ticket retrieved.",
        ticket: response.data.ticket,
      };
    } else {
      return {
        success: false,
        message: response.message || "An error occurred while getting the SSE ticket.",
      };
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[SSE ticket controller] Error:", error instanceof Error ? error.message : error);
    }
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
    };
  }
};