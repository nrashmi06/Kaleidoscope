"use client";

import React, { useState } from "react";
import VideoCard from "@/components/video/VideoCard";
import LiveStreamPage from "@/components/video/LiveStreamPage";
import { Search, Film } from "lucide-react";
import { Input } from "@/components/ui/input";

const dummyVideos = [
  { id: 1 },
  { id: 2 },
  { id: 3 },
  { id: 4 },
  { id: 5 },
  { id: 6 },
];

export default function VideosPage() {
  const [search, setSearch] = useState("");

  const filteredVideos = dummyVideos.filter(() => true);

  return (
    <div className="min-h-screen w-full py-6 px-4 sm:px-6 lg:px-8 relative">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-steel/[0.04] dark:bg-steel/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-[10%] w-80 h-80 bg-sky/[0.05] dark:bg-sky/[0.02] rounded-full blur-[80px]" />
      </div>

      {/* Live Stream Section */}
      <div className="max-w-7xl mx-auto mb-1">
        <h2 className="text-xl font-display font-bold text-navy dark:text-cream mb-1">
          Live Stream
        </h2>
        <LiveStreamPage />
      </div>

      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-steel to-steel-600 shadow-lg shadow-steel/25 dark:shadow-steel/15 dark:from-sky dark:to-steel">
              <Film className="w-5 h-5 text-cream-50" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-navy dark:text-cream tracking-tight">
                Video Library
              </h1>
              <p className="text-[11px] text-steel dark:text-sky/60">
                Browse trending videos and discover creators
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel/50 dark:text-sky/40" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search videos..."
              className="pl-10 h-9 text-sm bg-cream-50/60 dark:bg-navy-700/30 border-cream-300/40 dark:border-navy-700/40 rounded-xl"
            />
          </div>
        </div>

        {/* Gradient divider */}
        <div className="mt-5 h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />
      </div>

      {/* Video Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredVideos.map((video) => (
          <VideoCard key={video.id} />
        ))}
      </div>
    </div>
  );
}
