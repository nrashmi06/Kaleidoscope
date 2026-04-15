// src/app/(auth)/feed/page.tsx
"use client";

import React from "react";
// ✅ 1. Import the new PostFeed component
import PostFeed from "@/components/feed/PostFeed";

// ❌ 2. Remove the old FeedMain component
// import FeedMain from "@/components/feed/FeedMain";

export default function FeedPage() {
  return (
    <div className="w-full">
      <PostFeed />
    </div>
  );
}