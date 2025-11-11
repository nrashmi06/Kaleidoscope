// src/services/notifications/notificationStreamService.ts

import type { UnseenCountPayload } from "@/lib/types/notificationSSEType";

export type NotificationCallbacks = {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err?: unknown) => void;
  onUnseenCount?: (payload: UnseenCountPayload) => void;
};

export class NotificationStreamService {
  private es: EventSource | null = null;
  private readonly baseUrl = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/kaleidoscope/api/notifications/stream`;

  /**
   * Connects to the SSE stream using a one-time ticket.
   * @param ticket - The one-time ticket obtained from /api/auth/sse-ticket.
   * @param callbacks - Event callbacks for open, close, error, etc.
   */
  connect(ticket: string, callbacks: NotificationCallbacks = {}) {
    this.disconnect();

    // ✅ Must have a real ticket
    if (!ticket || ticket.trim().length < 10) {
      console.warn("[SSE] Missing or invalid ticket");
      callbacks.onError?.(new Error("Missing or invalid ticket"));
      return;
    }

    const raw = ticket; // Ticket is already the raw string
    const url = `${this.baseUrl}?ticket=${encodeURIComponent(raw)}`;

    if (process.env.NODE_ENV !== "production") {
      const masked = raw.length > 12 ? `${raw.slice(0, 6)}...${raw.slice(-6)}` : raw;
      console.debug(`[SSE] Connecting → ${this.baseUrl}?ticket=${masked}`);
    }

    try {
      this.es = new EventSource(url);

      this.es.onopen = () => {
        callbacks.onOpen?.();
      };

      this.es.onerror = (err) => {
        // ✅ Simplified: Just report the error. The controller will handle retries.
        callbacks.onError?.(err);
        callbacks.onClose?.();
        this.es?.close();
      };

      this.es.addEventListener("unseen-count", (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data) as UnseenCountPayload | number;
          const payload = typeof data === "number" ? { count: data } : data;
          callbacks.onUnseenCount?.(payload);
        } catch (e) {
          callbacks.onError?.(e);
        }
      });

    } catch (err) {
      callbacks.onError?.(err);
    }
  }

  /**
   * Disconnects the EventSource connection.
   */
  disconnect() {
    if (this.es) {
      try { this.es.close(); } catch (error) {
        console.error("The notification stream close error: ", error);
      }
      this.es = null;
    }
  }
}

export default NotificationStreamService;