"use client";

import { Heart, MessageCircle, Bookmark, MoreHorizontal } from "lucide-react";

export function SocialPostCard() {
  return (
    <div className="w-full max-w-full mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
            <img
              src="/person4.jpg?height=48&width=48"
              alt="Don Jhon Doe"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold text-base text-gray-900 dark:text-white">Don Jhon Doe</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">14 Aug 2025 4:30PM</p>
          </div>
        </div>
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800">
          <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 space-y-4">
        {/* Images */}
        <div className="grid grid-cols-2 gap-2">
          <div className="aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
            <img
              src="/nature1.jpg?height=300&width=400"
              alt="Forest stream"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
            <img
              src="/nature2.jpg?height=300&width=400"
              alt="Forest stream"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Text */}
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
          magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
          consequat.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-6">
            <button className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-red-500">
              <Heart className="w-4 h-4 mr-2" />
              30 Likes
            </button>
            <button className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500">
              <MessageCircle className="w-4 h-4 mr-2" />
              3 Comments
            </button>
          </div>
          <button className="text-gray-600 dark:text-gray-300 hover:text-yellow-500">
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
