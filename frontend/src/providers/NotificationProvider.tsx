"use client";

import React, { useEffect } from "react";
import useNotificationStream from "@/hooks/useNotificationStream";
import { useAppSelector } from "@/hooks/useAppSelector";

type Props = {
  children: React.ReactNode;
};

export default function NotificationProvider({ children }: Props) {
  const token = useAppSelector((s) => s.auth?.accessToken ?? null);

  // Start stream only when token is present. The hook itself also validates token.
  useNotificationStream(Boolean(token));

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const masked = token ? (token.length > 12 ? `${token.slice(0,6)}...${token.slice(-6)}` : token) : '(none)';
  console.debug(`[SSE provider] token present: ${Boolean(token)}, masked: ${masked}`);
    }
  }, [token]);

  return <>{children}</>;
}
