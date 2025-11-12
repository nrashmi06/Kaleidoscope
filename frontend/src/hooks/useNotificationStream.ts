// src/hooks/useNotificationStream.ts
'use client'
import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/hooks/appDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { startNotificationStream } from "@/controllers/notificationController/notificationController";

/**
 * ❌ REMOVED the isJwtValid(token) function
 * Client-side validation is too brittle. We will let the
 * /api/auth/sse-ticket endpoint validate the token.
 */

export default function useNotificationStream(active = true) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth?.accessToken ?? null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!active) return undefined;


    if (!token) {
      if (process.env.NODE_ENV !== "production") {
        console.debug('[Notification] SSE not started - no token');
      }
      return undefined;
    }

    // This call will now be made as long as a token exists.
    console.info('[Notification] Starting SSE stream' , token);
    stopRef.current = startNotificationStream(dispatch, token);

    return () => {
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [active, dispatch, token]);
}