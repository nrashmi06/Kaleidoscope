import React from "react";
import Image from "next/image";
import { Play } from "lucide-react";

export default function VideoCard() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
      {/* Video Thumbnail */}
      <div className="relative aspect-video bg-black group cursor-pointer">
        <Image
          src="/nature1.jpg"
          alt="Video thumbnail"
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Overlay shading */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Title in center */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <h2 className="text-white text-4xl font-bold text-center leading-tight drop-shadow">
            THE<br />OF
          </h2>
        </div>

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/90 hover:bg-white rounded-full p-4 transition-all duration-200 group-hover:scale-110">
            <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Extra hover overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>

      {/* Video info */}
      <div className="p-4 flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
          <Image
            src="/person4.jpg?height=40&width=40"
            alt="Profile picture"
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Meta info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight mb-1 line-clamp-2">
            The Title Of The Video On Display
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-0.5">Jhon Doe</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">19 hours ago</p>
        </div>
      </div>
    </div>
  );
}
