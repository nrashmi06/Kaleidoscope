import NotificationStreamService from "@/services/notifications/notificationStreamService";
import { setCount, setConnected, setError } from "@/store/notificationSlice";
import type { UnseenCountPayload } from "@/lib/types/notificationSSEType";
import type { AppDispatch } from "@/store";

const svc = new NotificationStreamService();

/**
 * Start stream and return a cleanup function to stop it.
 */
export function startNotificationStream(dispatch: AppDispatch, token: string | null) {
  dispatch(setConnected(false));
  dispatch(setError(null));

  svc.connect(token, {
    onOpen: () => dispatch(setConnected(true)),
    onClose: () => dispatch(setConnected(false)),
    onError: (err) => {
      dispatch(setConnected(false));
      dispatch(setError(err?.toString?.() ?? "Connection error"));
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

  return () => {
    svc.disconnect();
    dispatch(setConnected(false));
  };
}

export function stopNotificationStream() {
  svc.disconnect();
}
