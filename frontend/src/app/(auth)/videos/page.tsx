"use client";

import React, { useState } from "react";
import VideoCard from "@/components/video/VideoCard";
import LiveStreamPage from "@/components/video/LiveStreamPage";
import { Search } from "lucide-react";
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
    <div className="w-full">
      {/* Live Stream Section */}
      <div className="w-full mb-1">
        <h2 className="text-xl font-display font-bold text-heading mb-1">
          Live Stream
        </h2>
        <LiveStreamPage />
      </div>

      {/* Page Header */}
      <div className="w-full pt-6 pb-5 px-1">
        <h1 className="text-2xl font-display font-bold text-heading tracking-tight">
          Videos
        </h1>
        <p className="mt-1 text-sm text-steel/50 dark:text-sky/35">
          Browse trending videos and discover creators
        </p>

        {/* Search Bar */}
        <div className="mt-4 flex items-center gap-3 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-steel/40 dark:text-sky/30" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search videos..."
              className="pl-10 h-10 text-sm bg-cream-300/30 dark:bg-navy-700/30 border-0 rounded-xl placeholder:text-steel/40 dark:placeholder:text-sky/25 focus-visible:ring-2 focus-visible:ring-steel/20 dark:focus-visible:ring-sky/20"
            />
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredVideos.map((video) => (
          <VideoCard key={video.id} />
        ))}
      </div>
    </div>
  );
}
