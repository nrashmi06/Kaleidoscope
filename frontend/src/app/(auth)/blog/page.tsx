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
    <div className="flex flex-col md:flex-row h-screen w-full bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      
      {/* Left/Main Content - Scrollable */}
      <div className="w-full md:w-3/4 h-screen overflow-y-auto hide-scrollbar">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 px-4 md:px-6 bg-white dark:bg-neutral-950">
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
                    : "bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-300"
                }`}
                onClick={() => setSelected("popular")}
              >
                Popular
              </button>
              <button
                className={`px-4 py-2 rounded-sm text-sm transition-colors ${
                  selected === "latest"
                    ? "bg-gradient-to-r from-sky-900 to-blue-700 text-white"
                    : "bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-300"
                }`}
                onClick={() => setSelected("latest")}
              >
                Latest
              </button>
            </div>
          </div>
        </div>

        {/* Feed List */}
        <div className="px-3 md:px-3">
          <FeedList />
        </div>
      </div>

      {/* Right Sidebar - Scrollable */}
      <div className="hidden md:flex md:flex-col md:w-[35%] md:mr-5 h-screen overflow-y-auto bg-white dark:bg-neutral-900 px-4 py-6 rounded-md shadow-sm hide-scrollbar">
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900">
            <Requests />
          </div>
          <div className="w-full h-0.5 bg-slate-100 dark:bg-neutral-700"></div>
          <div className="bg-white dark:bg-neutral-900">
            <Suggestions />
          </div>
          <div className="w-full h-0.5 bg-slate-100 dark:bg-neutral-700"></div>
          <div className="bg-white dark:bg-neutral-900">
            <Followers />
          </div>
        </div>
      </div>
    </div>
  );
}
