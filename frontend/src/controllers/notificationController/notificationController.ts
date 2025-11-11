// src/controllers/notificationController/notificationController.ts

import NotificationStreamService from "@/services/notifications/notificationStreamService";
import { setCount, setConnected, setError } from "@/store/notificationSlice";
import type { UnseenCountPayload } from "@/lib/types/notificationSSEType";
import type { AppDispatch } from "@/store";
import { getSseTicketController } from "@/controllers/auth/getSseTicketController";

const svc = new NotificationStreamService();

// --- Reconnect Logic ---
let reconnectTimer: number = 0;
let reconnectAttempts = 0;
const baseReconnectDelay = 1000;
const maxReconnectDelay = 30000;

/**
 * Start stream and return a cleanup function to stop it.
 */
export function startNotificationStream(dispatch: AppDispatch, token: string | null) {
  dispatch(setConnected(false));
  dispatch(setError(null));

  if (reconnectTimer) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = 0;
  }
  reconnectAttempts = 0;

  const scheduleRetry = () => {
    if (reconnectTimer) return;

    reconnectAttempts++;
    const delay = Math.min(
      maxReconnectDelay,
      baseReconnectDelay * Math.pow(2, reconnectAttempts) + (Math.random() * 1000)
    );

    // ✅ DEBUG: Check if token is still available in this closure
    
    console.warn(`[SSE Controller] Connection lost. Reconnecting in ${Math.round(delay / 1000)}s... (Attempt ${reconnectAttempts})`);

    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = 0;
      // ✅ FIX: Pass the 'token' from the parent scope
      getTicketAndConnect(token); 
    }, delay);
  };

  /**
   * The core logic: Get a ticket, then connect.
   */
  // ✅ FIX: 'token' parameter now correctly receives the value
  const getTicketAndConnect = async (currentToken: string | null) => {
    if (!currentToken) {
      dispatch(setError("No auth token, cannot connect to SSE."));
      // We don't retry if the token is gone (e.g., user logged out)
      return;
    }


    // 1. Fetch the one-time ticket
    const ticketResult = await getSseTicketController(currentToken);

    if (!ticketResult.success || !ticketResult.ticket) {
      dispatch(setError(ticketResult.message || "Failed to get SSE ticket."));
      // If we fail to get a ticket (e.g., 401), schedule a retry.
      // The retry will use the same token, which might be expired,
      // but the axios interceptor should handle refreshing it.
      scheduleRetry();
      return;
    }

    // 2. Use the ticket to connect
    svc.connect(ticketResult.ticket, {
      onOpen: () => {
        reconnectAttempts = 0;
        dispatch(setConnected(true));
      },
      onClose: () => {
        dispatch(setConnected(false));
        scheduleRetry();
      },
      onError: (err) => {
        dispatch(setConnected(false));
        dispatch(setError(err?.toString?.() ?? "Connection error"));
        scheduleRetry();
      },
      onUnseenCount: (payload: UnseenCountPayload) => {
        try {
          console.debug('[notification] SSE unseen-count received', payload);
        } catch {}
        dispatch(setCount(payload.count));
        try {
          console.debug('[notification] dispatched setCount', payload.count);
        } catch {}
      },
    });
  };

  // Start the connection attempt
  // ✅ FIX: Pass the initial 'token' to the function
  getTicketAndConnect(token);

  // Return the cleanup function
  return () => {
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = 0;
    }
    reconnectAttempts = 0;
    svc.disconnect();
    dispatch(setConnected(false));
  };
}

/**
 * Public function to manually stop the stream and all retry attempts.
 */
export function stopNotificationStream() {
  if (reconnectTimer) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = 0;
  }
  reconnectAttempts = 0;
  svc.disconnect();
}