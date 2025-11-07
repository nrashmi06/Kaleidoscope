'use client'
import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/hooks/appDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { startNotificationStream } from "@/controllers/notificationController";

function isJwtValid(token: string) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    // decode payload
    const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);
    if (payload.exp && typeof payload.exp === 'number') {
      // exp is in seconds since epoch
      return payload.exp * 1000 > Date.now();
    }
    // if no exp claim, consider token invalid for safety
    return false;
  } catch {
    // malformed token
    return false;
  }
}

export default function useNotificationStream(active = true) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth?.accessToken ?? null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!active) return undefined;

    // Only attempt to connect when we have a well-formed, non-expired JWT
    if (!token || !isJwtValid(token)) {
      // make sure any existing connection is torn down
      stopRef.current?.();
      stopRef.current = null;
      // Optionally you can dispatch an error state here or log for debugging
      // console.debug('[Notification] SSE not started - missing or invalid token');
      return undefined;
    }

    stopRef.current = startNotificationStream(dispatch, token);

    return () => {
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [active, dispatch, token]);
}