"use client";

import React, { useState } from "react";
import VideoCard from "@/components/video/VideoCard";
import LiveStreamPage from "@/components/video/LiveStreamPage";

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

  // Filter videos (if titles were passed in props, you’d filter by them)
  const filteredVideos = dummyVideos.filter(() => true); // Replace with actual filtering logic later

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">

        {/* Live Stream Section */ }
        <div className="max-w-7xl mx-auto mb-1">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Live Stream
            </h2>
            <LiveStreamPage />
       </div>
               
      {/* Page Header */}
      <div className="max-w-7xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Video Library
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse trending videos, explore topics, and discover creators.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-md mx-auto mb-10">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search videos..."
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Video Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredVideos.map((video) => (
          <VideoCard key={video.id} />
        ))}
      </div>
    </div>
  );
}
