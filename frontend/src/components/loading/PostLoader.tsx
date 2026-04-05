"use client";

import React from "react";

export default function PostLoader() {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden h-[480px] bg-cream-50 dark:bg-navy border border-cream-300/40 dark:border-navy-700/40 shadow-sm animate-pulse">
      {/* Image placeholder */}
      <div
        className="w-full bg-cream-300/80 dark:bg-navy-700/80"
        style={{ height: "55%" }}
      />

      {/* Wave SVG skeleton */}
      <svg
        className="absolute left-0 w-full pointer-events-none"
        style={{ top: "calc(55% - 80px)", height: "130px" }}
        viewBox="0 0 800 500"
        preserveAspectRatio="none"
      >
        <path
          d="M 0 30 C 150 30 250 200 400 200 S 650 30 800 30 L 800 500 L 0 500"
          className="fill-cream-50 dark:fill-navy"
        />
      </svg>

      {/* Content placeholder */}
      <div className="relative z-10 px-5 pt-2" style={{ height: "45%" }}>
        <div className="space-y-3 pt-1">
          <div className="w-4/5 h-3 bg-cream-300 dark:bg-navy-700 rounded-full" />
          <div className="w-3/5 h-3 bg-cream-300/70 dark:bg-navy-700/70 rounded-full" />
          <div className="w-2/3 h-3 bg-cream-300/50 dark:bg-navy-700/50 rounded-full" />
        </div>
        <div className="absolute bottom-4 left-5 right-5">
          <div className="w-full h-9 bg-cream-300/40 dark:bg-navy-700/40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
