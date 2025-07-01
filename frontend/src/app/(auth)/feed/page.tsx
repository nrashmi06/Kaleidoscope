"use client";

import React from "react";
import StoryCircles from "@/components/feed/StoryCircles";
import { PostCreationInput } from "@/components/feed/PostCreationInput";
import { SocialPostCard } from "@/components/feed/SocialPostCard";
import { MessagesComponent } from "@/components/feed/MessagesComponent";
import { LiveEvents } from "@/components/feed/LiveEvents";

export default function FeedPage() {
  return (
    <div className="min-h-screen w-full ">
      <div className="max-w-full mx-auto flex flex-col lg:flex-row gap-3">
        
        {/* Main Feed Column */}
        <div className="flex-1 space-y-6">
          {/* Stories */}
          <StoryCircles />

          {/* Post Input */}
          <PostCreationInput />

          {/* Social Feed */}
          <SocialPostCard />
          <SocialPostCard />
          <SocialPostCard />
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-80 flex flex-col space-y-6">
          <MessagesComponent />
          <LiveEvents />
        </div>
      </div>
    </div>
  );
}
