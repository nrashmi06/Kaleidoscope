// src/app/(auth)/feed/page.tsx
"use client";

import React from "react";
// ✅ 1. Import the new PostFeed component
import PostFeed from "@/components/feed/PostFeed";

// ❌ 2. Remove the old FeedMain component
// import FeedMain from "@/components/feed/FeedMain";

export default function FeedPage() {
  return (
    <div className="min-h-screen w-full">
      {/* ✅ 3. Render the new self-contained PostFeed component */}
      <PostFeed />
      
      {/* ❌ 4. Old component is no longer used */}
      {/* <FeedMain /> */}
    </div>
  );
}