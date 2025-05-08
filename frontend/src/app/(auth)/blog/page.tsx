'use client';
import { useState } from "react";
import FeedList from "@/components/ui/FeedList";
import Requests from "@/components/ui/Requests";
import Suggestions from "@/components/ui/Suggestions";
import Followers from "@/components/ui/Followers";
import SearchAndCreate from "@/components/ui/SearchAndCreate";

export default function Home() {
  const [selected, setSelected] = useState("popular");

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full rounded-md">
      {/* Middle Column - Main Content (100% on mobile, 75% on md+) */}
      <div className="w-full md:w-3/4 h-screen overflow-y-auto overflow-x-hidden hide-scrollbar">
        {/* Sticky Search and Create Post */}
        <div className="sticky top-0 z-20 px-4 md:px-6">
          <SearchAndCreate />
        </div>

        {/* Feed Header */}
        <div className="px-4 md:px-6 py-2">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">Feed</h1>
            <div className="flex space-x-2 p-2">
              <button
                className={`px-4 py-2 rounded-sm text-sm transition-colors ${
                  selected === "popular"
                    ? "bg-gradient-to-r from-sky-900 to-blue-700 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
                onClick={() => setSelected("popular")}
              >
                Popular
              </button>
              <button
                className={`px-4 py-2 rounded-sm text-sm transition-colors ${
                  selected === "latest"
                    ? "bg-gradient-to-r from-sky-900 to-blue-700 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
                onClick={() => setSelected("latest")}
              >
                Latest
              </button>
            </div>
          </div>
        </div>

        {/* Feed Section */}
        <div className="px-3 md:px-3">
          <FeedList />
        </div>
      </div>

      {/* Suggestions Column (hidden on small screens) */}
      <div className="hidden md:block md:w-[35%] p-4 md:p-3 sticky top-0 h-screen overflow-y-auto bg-white dark:bg-neutral-900 rounded-md shadow-sm hide-scrollbar">
        <div className="space-y-6">
          <div className="bg-white ">
            <Requests />
          </div>
          <div className="w-full h-0.5 bg-slate-100"></div>
          <div className="bg-white ">
            <Suggestions />
          </div>
          <div className="w-full h-0.5 bg-slate-100"></div>
          <div className="bg-white">
            <Followers />
          </div>
        </div>
      </div>
    </div>
  );
}
