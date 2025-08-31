"use client";

import React, { useEffect, useState } from "react";
import StoryCircles from "@/components/feed/StoryCircles";
import { PostCreationInput } from "@/components/feed/PostCreationInput";
import { SocialPostCard } from "@/components/feed/SocialPostCard";
import { MessagesComponent } from "@/components/feed/MessagesComponent";
import { LiveEvents } from "@/components/feed/LiveEvents";
import { useTheme } from "next-themes";
import { getUserPreferencesByIdAdminController } from "@/controllers/userPreferencesController/getUserPreferencesByIdAdminController";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useAccessToken } from "@/hooks/useAccessToken";
import { fetchPostsController } from "@/controllers/postController/fetchPosts";
import { Post } from "@/services/post/fetchPosts";

export default function FeedPage() {
  const { userId } = useAppSelector((state) => state.auth);
  const accessToken = useAccessToken();
  const { setTheme } = useTheme(); 
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const applyUserThemePreference = async () => {
      if (!userId || !accessToken) return;

      const res = await getUserPreferencesByIdAdminController({ userId }, accessToken);
      if (res.success && res.data?.theme) {
        const pref = res.data.theme;
        if (pref === "LIGHT") setTheme("light");
        else if (pref === "DARK") setTheme("dark");
        else if (pref === "SYSTEM") setTheme("system");
      }
    };

    applyUserThemePreference();
  }, [userId, accessToken, setTheme]); // make sure setTheme is in deps

  useEffect(() => {
    const fetchPosts = async () => {
      if (!accessToken) return;
      
      setIsLoading(true);
      try {
        const result = await fetchPostsController(accessToken, {
          page: 0,
          size: 10,
          sortBy: "createdAt",
          sortDirection: "DESC"
        });
        
        if (result.success && result.data) {
          setPosts(result.data.data.content);
        } else {
          console.error("Failed to fetch posts:", result.error);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [accessToken]);

  // Listen for new posts created from create-post page
  useEffect(() => {
    const handleNewPost = (event: CustomEvent<Post>) => {
      addNewPostToFeed(event.detail);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('newPostCreated', handleNewPost as EventListener);
      
      return () => {
        window.removeEventListener('newPostCreated', handleNewPost as EventListener);
      };
    }
  }, []);

  const addNewPostToFeed = (newPost: Post) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  return (
    <div className="min-h-screen w-full">
      <div className="max-w-full mx-auto flex flex-col lg:flex-row gap-3">
        {/* Main Feed Column */}
        <div className="flex-1 space-y-6">
          <StoryCircles />
          <PostCreationInput onPostCreated={addNewPostToFeed} />
          
          {/* Posts Feed */}
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">Loading posts...</div>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <SocialPostCard key={post.postId} post={post} />
            ))
          ) : (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">No posts found</div>
            </div>
          )}
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
