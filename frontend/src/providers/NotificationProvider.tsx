// src/providers/NotificationProvider.tsx
"use client";

import React, { useEffect } from "react";
import useNotificationStream from "@/hooks/useNotificationStream";
import { useAppSelector } from "@/hooks/useAppSelector";

type Props = {
  children: React.ReactNode;
};

export default function NotificationProvider({ children }: Props) {
  // ✅ 1. Get token, interest status, AND role
  const { accessToken, isUserInterestSelected, role } = useAppSelector((s) => s.auth);
  const token = accessToken ?? null;
  const isAdmin = role === 'ADMIN';

  // ✅ 2. MODIFIED LOGIC:
  // The stream is active if the user is authenticated AND
  // (they have finished onboarding OR they are an admin who skips it).
  const isReady = isUserInterestSelected || isAdmin;
  const isActive = Boolean(token) && isReady;

  // ✅ 3. Pass this 'isActive' flag to the hook.
  useNotificationStream(isActive);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const masked = token ? (token.length > 12 ? `${token.slice(0,6)}...${token.slice(-6)}` : token) : '(none)';
      console.debug(`[SSE provider] token: ${masked}, interests: ${isUserInterestSelected}, isAdmin: ${isAdmin}, stream active: ${isActive}`);
      // ✅ 4. Updated debug log
      console.debug(`[SSE provider] token: ${Boolean(token)}, interests: ${isUserInterestSelected}, isAdmin: ${isAdmin}, stream active: ${isActive}`);
    }
  }, [token, isUserInterestSelected, isActive, isAdmin]);

  return <>{children}</>;
}