"use client";

import React, { useEffect } from "react";
import { MessagesComponent } from "@/components/feed/MessagesComponent";
import { LiveEvents } from "@/components/feed/LiveEvents";
import FeedHeader from "@/components/feed/FeedHeader";
import FeedPosts from "@/components/feed/FeedPosts";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { useTheme } from "next-themes";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useAccessToken } from "@/hooks/useAccessToken";
import { getUserPreferencesByIdAdminController } from "@/controllers/userPreferencesController/getUserPreferencesByIdAdminController";

export default function FeedMain() {
  const { posts, isLoading, isRefreshing, hasMorePosts, handlers } = useFeedPosts();
  const { refreshPosts, loadMorePosts, handlePostDeleted } = handlers;

  const { userId } = useAppSelector((state) => state.auth);
  const accessToken = useAccessToken();
  const { setTheme } = useTheme();

  useEffect(() => {
    const applyTheme = async () => {
      if (!userId || !accessToken) return;
      const res = await getUserPreferencesByIdAdminController({ userId }, accessToken);
      if (res.success && res.data?.theme) {
        setTheme(res.data.theme.toLowerCase());
      }
    };
    applyTheme();
  }, [userId, accessToken, setTheme]);

  return (
    <div className="max-w-full mx-auto flex flex-col lg:flex-row gap-3">
      {/* Left/Main Column */}
      <div className="flex-1 space-y-6 p-3">
        <FeedHeader
          isRefreshing={isRefreshing}
          refreshPosts={refreshPosts}
        />

        <FeedPosts
          posts={posts}
          isLoading={isLoading}
          hasMorePosts={hasMorePosts}
          loadMorePosts={loadMorePosts}
          handlePostDeleted={handlePostDeleted}
        />
      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-80 flex flex-col space-y-6">
        <MessagesComponent />
        <LiveEvents />
      </div>
    </div>
  );
}
