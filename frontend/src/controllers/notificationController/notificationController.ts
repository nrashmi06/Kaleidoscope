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
// ❌ Removed old delay constants
// const baseReconnectDelay = 1000;
// const maxReconnectDelay = 30000;

// ✅ 1. Set the fixed 10-minute delay
const FIXED_RECONNECT_DELAY = 10 * 60 * 1000; 

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
    
    // ❌ 2. Removed the exponential backoff logic
    // const delay = Math.min(
    //   maxReconnectDelay,
    //   baseReconnectDelay * Math.pow(2, reconnectAttempts) + (Math.random() * 100000)
    // );

    // ✅ 3. Use the fixed 10-minute delay and update the log message
    console.warn(`[SSE Controller] Connection lost. Reconnecting in 10 minutes... (Attempt ${reconnectAttempts})`);

    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = 0;
      getTicketAndConnect(token); 
    }, FIXED_RECONNECT_DELAY); // <-- Use the fixed 10-minute delay
  };

  /**
   * The core logic: Get a ticket, then connect.
   */
  const getTicketAndConnect = async (currentToken: string | null) => {
    if (!currentToken) {
      dispatch(setError("No auth token, cannot connect to SSE."));
      return;
    }

    // 1. Fetch the one-time ticket
    const ticketResult = await getSseTicketController(currentToken);

    if (!ticketResult.success || !ticketResult.ticket) {
      dispatch(setError(ticketResult.message || "Failed to get SSE ticket."));
      // If we fail to get a ticket, schedule the retry
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
        // Connection closed (e.g., server restart, network change)
        scheduleRetry();
      },
      onError: (err) => {
        dispatch(setConnected(false));
        dispatch(setError(err?.toString?.() ?? "Connection error"));
        // An error occurred (e.g., ticket invalid, network error)
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