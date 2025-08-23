"use client";
import { Calendar, MoreHorizontal } from "lucide-react";

const events = [
  {
    id: 1,
    title: "10 Insights of the Year Event",
    date: "14 Aug 2025",
    time: "4:30PM",
  },
  {
    id: 2,
    title: "Tech Leadership Conference",
    date: "20 Sep 2025",
    time: "11:00AM",
  },
  {
    id: 3,
    title: "Annual Product Summit",
    date: "5 Oct 2025",
    time: "2:00PM",
  },
  {
    id: 4,
    title: "Future of AI Panel",
    date: "22 Nov 2025",
    time: "5:00PM",
  },
];

export function LiveEvents() {
  return (
    <div className="w-full max-w-md mx-auto rounded-xl shadow-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-neutral-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Live Events
        </h2>
        <button className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Events List */}
      <div className="px-5 py-4 space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer group"
          >
            {/* Left: Icon and Title */}
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-full">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100 group-hover:underline">
                {event.title}
              </span>
            </div>

            {/* Right: Date & Time - consistently aligned */}
            <div className="flex flex-col items-end text-xs text-gray-500 dark:text-gray-400 min-w-[110px]">
              <span>{event.date}</span>
              <span>{event.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
