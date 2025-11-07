import type { UnseenCountPayload } from "@/lib/types/notification";

export type NotificationCallbacks = {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err?: unknown) => void;
  onUnseenCount?: (payload: UnseenCountPayload) => void;
};

export class NotificationStreamService {
  private es: EventSource | null = null;
  private reconnectTimer: number = 0;
  private readonly reconnectDelay = 3000;
  private readonly baseUrl = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}kaleidoscope/api/notifications/stream`;

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

      this.es.onopen = () => callbacks.onOpen?.();

      this.es.onerror = (err) => {
        callbacks.onError?.(err);
        callbacks.onClose?.();
        this.scheduleReconnect(token, callbacks);
      };

      this.es.addEventListener("unseen-count", (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data) as UnseenCountPayload | number;
          const payload = typeof data === "number" ? { count: data } : data;
          console.info("connected to sse ");
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

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = 0;
      this.connect(token, callbacks);
    }, this.reconnectDelay);
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
  }
}

export default NotificationStreamService;
