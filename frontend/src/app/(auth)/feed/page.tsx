"use client";

import React, { useEffect } from "react";
import StoryCircles from "@/components/feed/StoryCircles";
import { PostCreationInput } from "@/components/feed/PostCreationInput";
import { SocialPostCard } from "@/components/feed/SocialPostCard";
import { MessagesComponent } from "@/components/feed/MessagesComponent";
import { LiveEvents } from "@/components/feed/LiveEvents";
import { useTheme } from "next-themes";
import { getUserPreferencesByIdAdminController } from "@/controllers/userPreferencesController/getUserPreferencesByIdAdminController";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useAccessToken } from "@/hooks/useAccessToken";

export default function FeedPage() {
  const { userId } = useAppSelector((state) => state.auth);
  const accessToken = useAccessToken();
  const { setTheme } = useTheme(); 

  useEffect(() => {
    const applyUserThemePreference = async () => {
      if (!userId || !accessToken) return;

      const res = await getUserPreferencesByIdAdminController({ userId }, accessToken);
      if (res.success && res.data?.theme) {
        const pref = res.data.theme;
        if (pref === "LIGHT") setTheme("light");
        else if (pref === "DARK") setTheme("dark");
        else if (pref === "SYSTEM") setTheme("system");
      }
    };

    applyUserThemePreference();
  }, [userId, accessToken, setTheme]); // make sure setTheme is in deps

  return (
    <div className="min-h-screen w-full">
      <div className="max-w-full mx-auto flex flex-col lg:flex-row gap-3">
        {/* Main Feed Column */}
        <div className="flex-1 space-y-6">
          <StoryCircles />
          <PostCreationInput />
          <SocialPostCard />
          <SocialPostCard />
          <SocialPostCard />
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-80 flex flex-col space-y-6">
          <MessagesComponent />
          <LiveEvents />
        </div>
      </div>
    </div>
  );
}
