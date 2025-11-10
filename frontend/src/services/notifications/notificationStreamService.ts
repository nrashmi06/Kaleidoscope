import type { UnseenCountPayload } from "@/lib/types/notificationSSEType";

export type NotificationCallbacks = {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err?: unknown) => void;
  onUnseenCount?: (payload: UnseenCountPayload) => void;
};

export class NotificationStreamService {
  private es: EventSource | null = null;
  private reconnectTimer: number = 0;
  private readonly baseUrl = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/kaleidoscope/api/notifications/stream`;

  // --- Updated Reconnect Logic ---
  private reconnectAttempts = 0;
  private readonly baseReconnectDelay = 1000; // Start at 1 second
  private readonly maxReconnectDelay = 30000; // Max 30 seconds
  // --- End Updated Logic ---

  connect(token: string | null, callbacks: NotificationCallbacks = {}) {
    this.disconnect();

    // ✅ Must have a real token
    if (!token || token.trim().length < 10) {
      console.warn("[SSE] Missing or invalid token");
      callbacks.onError?.(new Error("Missing or invalid token"));
      return;
    }

    // ✅ Server expects raw JWT, no prefix
    const raw = token.startsWith("Bearer ") ? token.slice(7) : token;

    const url = `${this.baseUrl}?token=${encodeURIComponent(raw)}`;

    if (process.env.NODE_ENV !== "production") {
      const masked = raw.length > 12 ? `${raw.slice(0,6)}...${raw.slice(-6)}` : raw;
      console.debug(`[SSE] Connecting → ${this.baseUrl}?token=${masked}`);
    }

    try {
      this.es = new EventSource(url);

      this.es.onopen = () => {
        callbacks.onOpen?.();
        // ✅ NEW: Reset reconnect attempts on a successful connection
        this.reconnectAttempts = 0;
      };

      this.es.onerror = (err) => {
        callbacks.onError?.(err);
        callbacks.onClose?.();
        // ✅ NEW: Ensure the connection is fully closed before reconnecting
        this.es?.close();
        this.scheduleReconnect(token, callbacks);
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
      this.scheduleReconnect(token, callbacks);
    }
  }

  private scheduleReconnect(token: string, callbacks: NotificationCallbacks) {
    if (!token || token.trim().length < 10) return;
    if (this.reconnectTimer) return;

    // --- NEW: Exponential Backoff Calculation ---
    this.reconnectAttempts++;
    // Calculates delay: 1s, 2s, 4s, 8s, 16s, 30s (max) + random jitter
    const delay = Math.min(
      this.maxReconnectDelay,
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts) + (Math.random() * 1000)
    );
    
    console.warn(`[SSE] Connection error. Reconnecting in ${Math.round(delay / 1000)}s... (Attempt ${this.reconnectAttempts})`);
    // --- End New Logic ---

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = 0;
      this.connect(token, callbacks);
    }, delay); // <-- Use the new calculated delay
  }

  disconnect() {
    if (this.es) {
      try { this.es.close(); } catch (error) {
        console.error("The notification stream close error: ", error);
      }
      this.es = null;
    }
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = 0;
    }
    // ✅ NEW: Reset attempts on a manual disconnect (like logout)
    this.reconnectAttempts = 0;
  }
}

export default NotificationStreamService;