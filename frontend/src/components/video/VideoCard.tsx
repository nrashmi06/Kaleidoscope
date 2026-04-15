import React from "react";
import Image from "next/image";
import { Play } from "lucide-react";

export default function VideoCard() {
  return (
    <div className="w-full overflow-hidden rounded-2xl bg-cream-50 dark:bg-navy-700/50 border border-cream-300/40 dark:border-navy-700/40 hover:border-steel/30 dark:hover:border-sky/30 shadow-sm hover:shadow-lg hover:shadow-steel/[0.06] dark:hover:shadow-sky/[0.04] transition-all duration-300 group cursor-pointer">
      {/* Video Thumbnail */}
      <div className="relative aspect-video bg-navy/10 dark:bg-navy-700 overflow-hidden">
        <Image
          src="/nature1.jpg"
          alt="Video thumbnail"
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-navy/20 group-hover:bg-navy/30 transition-colors" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-cream-50/90 dark:bg-navy/80 backdrop-blur-sm rounded-full p-3 shadow-lg shadow-steel/20 dark:shadow-sky/15 group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 text-steel dark:text-sky ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Video info */}
      <div className="p-4 flex gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-cream-300 dark:bg-navy-600">
          <Image
            src="/person4.jpg?height=40&width=40"
            alt="Profile picture"
            width={36}
            height={36}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Meta info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-display font-bold text-navy dark:text-cream leading-snug mb-1 line-clamp-2 group-hover:text-steel dark:group-hover:text-sky transition-colors">
            The Title Of The Video On Display
          </h3>
          <p className="text-[11px] font-medium text-navy/70 dark:text-cream/60 mb-0.5">Jhon Doe</p>
          <p className="text-[11px] text-steel/50 dark:text-sky/40">19 hours ago</p>
        </div>
      </div>
    </div>
  );
}
