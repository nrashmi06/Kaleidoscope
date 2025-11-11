// src/components/feed/FeedMain.tsx
"use client";

import React, { useEffect, useState } from "react"; // ✅ Import useState
import FeedHeader from "@/components/feed/FeedHeader";
import FeedPosts from "@/components/feed/FeedPosts";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { useTheme } from "next-themes";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useAccessToken } from "@/hooks/useAccessToken";
import { getUserPreferencesByIdAdminController } from "@/controllers/userPreferencesController/getUserPreferencesByIdAdminController";
import { TrendingHashtagsModal } from "@/components/common/TrendingHashtagsModal"; // ✅ Import the new modal

export default function FeedMain() {
  const { posts, isLoading, isRefreshing, hasMorePosts, handlers } = useFeedPosts();
  const { refreshPosts, loadMorePosts, handlePostDeleted } = handlers;

  const { userId } = useAppSelector((state) => state.auth);
  const accessToken = useAccessToken();
  const { setTheme } = useTheme();

  // ✅ Add state for the modal
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

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
    <> {/* ✅ Add fragment wrapper */}
      <div className="max-w-full mx-auto flex flex-col lg:flex-row gap-3">
        {/* Left/Main Column */}
        <div className="flex-1 space-y-6 p-3">
          <FeedHeader
            isRefreshing={isRefreshing}
            refreshPosts={refreshPosts}
            // ✅ Pass the state setter to the header
            onFilterClick={() => setIsFilterModalOpen(true)} 
          />

          <FeedPosts
            posts={posts}
            isLoading={isLoading}
            hasMorePosts={hasMorePosts}
            loadMorePosts={loadMorePosts}
            handlePostDeleted={handlePostDeleted}
          />
        </div>
      </div>

      {/* ✅ Render the modal */}
      <TrendingHashtagsModal 
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
      />
    </>
  );
}