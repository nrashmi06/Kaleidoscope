// src/lib/types/sseTicket.ts

import type { StandardAPIResponse } from "./userBlockStatus"; // Re-using generic wrapper

/**
 * The structure of the 'data' object in a successful API response
 * from the /api/auth/sse-ticket endpoint.
 */
export interface SseTicketPayload {
  ticket: string;
  expiresIn: number; // e.g., 60 (seconds)
}

/**
 * The full API response type returned from the service layer.
 */
export type SseTicketApiResponse = StandardAPIResponse<SseTicketPayload>;

/**
 * A simplified and normalized result type returned by the controller
 * for clean frontend consumption.
 */
export interface SseTicketControllerResult {
  success: boolean;
  message: string;
  ticket?: string;
}