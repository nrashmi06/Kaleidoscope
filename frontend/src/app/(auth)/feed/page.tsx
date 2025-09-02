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
import { filterPostsController } from "@/controllers/postController/filterPosts";
import { fetchPostsController } from "@/controllers/postController/fetchPosts";
import { Post } from "@/services/post/fetchPosts";
import { RefreshCw } from "lucide-react";

export default function FeedPage() {
  const { userId } = useAppSelector((state) => state.auth);
  const accessToken = useAccessToken();
  const { setTheme } = useTheme(); 
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

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
      if (!accessToken) {
        console.log('❌ No access token available for fetching posts');
        return;
      }
      
      setIsLoading(true);
      try {
        console.log('🔄 Fetching posts from backend with accessToken:', accessToken ? 'Available' : 'Missing');
        
        // Try fetchPostsController first as it was working before
        console.log('🔄 Trying fetchPostsController first...');
        const fetchResult = await fetchPostsController(accessToken, {
          page: 0,
          size: 50,
          sortBy: "createdAt",
          sortDirection: "DESC"
        });
        
        console.log('📊 Fetch posts result:', fetchResult);
        
        if (fetchResult.success && fetchResult.data) {
          console.log('✅ Posts fetched with fetchPostsController:', fetchResult.data.data.content.length, 'posts');
          setPosts(fetchResult.data.data.content);
          setHasMorePosts(!fetchResult.data.data.last);
          setCurrentPage(0);
          return; // Exit early if successful
        }
        
        // If fetchPostsController fails, try filterPostsController
        console.log('🔄 Trying filterPostsController as fallback...');
        const result = await filterPostsController(accessToken, {
          page: 0,
          size: 50, // Fetch 50 posts at a time for better performance
          sort: "createdAt,desc",
          visibility: "PUBLIC",
          status: "PUBLISHED"
        });
        
        console.log('📊 Filter posts result:', result);
        
        if (result.success && result.data) {
          console.log('✅ Posts fetched with filterPostsController:', result.data.data.content.length, 'posts');
          let fetchedPosts = result.data.data.content;
          
          // Set pagination info
          setHasMorePosts(!result.data.data.last);
          setCurrentPage(0);
          
          // Check for pending posts in localStorage
          try {
            const pendingPostsStr = localStorage.getItem('pendingNewPosts');
            if (pendingPostsStr) {
              const pendingPosts: Post[] = JSON.parse(pendingPostsStr);
              console.log('📥 Found', pendingPosts.length, 'pending posts in localStorage');
              
              // Add pending posts that aren't already in the fetched posts
              const existingPostIds = new Set(fetchedPosts.map(p => p.postId));
              const newPendingPosts = pendingPosts.filter(p => !existingPostIds.has(p.postId));
              
              if (newPendingPosts.length > 0) {
                fetchedPosts = [...newPendingPosts, ...fetchedPosts];
                console.log('✅ Added', newPendingPosts.length, 'pending posts to feed');
              }
              
              // Clear processed pending posts
              localStorage.removeItem('pendingNewPosts');
            }
          } catch (error) {
            console.warn('Error processing pending posts:', error);
          }
          
          setPosts(fetchedPosts);
        } else {
          console.error("❌ Both fetchPostsController and filterPostsController failed");
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [accessToken]);

  const refreshPosts = async () => {
    if (!accessToken) return;
    
    setIsRefreshing(true);
    try {
      console.log('🔄 Manually refreshing posts...');
      const result = await fetchPostsController(accessToken, {
        page: 0,
        size: 50, // Reset to first 50 posts
        sortBy: "createdAt",
        sortDirection: "DESC"
      });
      
      if (result.success && result.data) {
        console.log('✅ Posts refreshed:', result.data.data.content.length, 'posts');
        setPosts(result.data.data.content);
        setHasMorePosts(!result.data.data.last);
        setCurrentPage(0);
      } else {
        console.error("Failed to refresh posts:", result.error);
      }
    } catch (error) {
      console.error("Error refreshing posts:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadMorePosts = async () => {
    if (!accessToken || !hasMorePosts) return;
    
    try {
      console.log('🔄 Loading more posts...');
      const nextPage = currentPage + 1;
      const result = await filterPostsController(accessToken, {
        page: nextPage,
        size: 50,
        sort: "createdAt,desc",
        visibility: "PUBLIC",
        status: "PUBLISHED",
        q: searchQuery || undefined
      });
      
      if (result.success && result.data) {
        console.log('✅ More posts loaded:', result.data.data.content.length, 'posts');
        setPosts(prevPosts => [...prevPosts, ...(result.data?.data.content || [])]);
        setHasMorePosts(!result.data.data.last);
        setCurrentPage(nextPage);
      } else {
        console.error("Failed to load more posts:", result.error);
      }
    } catch (error) {
      console.error("Error loading more posts:", error);
    }
  };

  const loadAllPosts = async () => {
    if (!accessToken) return;
    
    setIsRefreshing(true);
    try {
      console.log('🔄 Loading ALL posts...');
      const result = await filterPostsController(accessToken, {
        page: 0,
        size: 1000, // Load a very large number to get all posts
        sort: "createdAt,desc",
        visibility: "PUBLIC",
        status: "PUBLISHED",
        q: searchQuery || undefined
      });
      
      if (result.success && result.data) {
        console.log('✅ ALL posts loaded:', result.data.data.content.length, 'posts');
        setPosts(result.data.data.content);
        setHasMorePosts(false);
        setCurrentPage(0);
      } else {
        console.error("Failed to load all posts:", result.error);
      }
    } catch (error) {
      console.error("Error loading all posts:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle post deletion
  const handlePostDeleted = (deletedPostId: string) => {
    console.log('🗑️ Removing deleted post from feed:', deletedPostId);
    setPosts(prevPosts => prevPosts.filter(post => post.postId.toString() !== deletedPostId));
  };

  // Handle search functionality
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!accessToken) return;

    try {
      console.log('🔍 Searching posts with query:', query);
      const result = await filterPostsController(accessToken, {
        page: 0,
        size: 50,
        sort: "createdAt,desc",
        visibility: "PUBLIC",
        status: "PUBLISHED",
        q: query || undefined
      });

      if (result.success && result.data) {
        console.log('✅ Search results:', result.data.data.content.length, 'posts');
        setPosts(result.data.data.content);
        setCurrentPage(0);
        setHasMorePosts(result.data.data.totalPages > 1);
      } else {
        console.error("Failed to search posts:", result.error);
      }
    } catch (error) {
      console.error("Error searching posts:", error);
    }
  };

  // Listen for new posts created from create-post page
  useEffect(() => {
    const handleNewPost = (event: CustomEvent<Post>) => {
      console.log('📢 Feed received new post event:', event.detail);
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
    console.log('🔄 Adding new post to feed:', newPost);
    setPosts(prevPosts => {
      // Check if this post already exists (to avoid duplicates)
      const existsIndex = prevPosts.findIndex(post => post.postId === newPost.postId);
      
      let newPosts;
      if (existsIndex >= 0) {
        // Update existing post
        newPosts = [...prevPosts];
        newPosts[existsIndex] = newPost;
        console.log('🔄 Updated existing post at index', existsIndex);
      } else {
        // Add new post at the beginning
        newPosts = [newPost, ...prevPosts];
        console.log('➕ Added completely new post');
      }
      
      console.log('📋 Feed now has', newPosts.length, 'posts (was', prevPosts.length, ')');
      console.log('📋 Post IDs:', newPosts.map(p => p.postId));
      return newPosts;
    });
  };

  return (
    <div className="min-h-screen w-full">
      <div className="max-w-full mx-auto flex flex-col lg:flex-row gap-3">
        {/* Main Feed Column */}
        <div className="flex-1 space-y-6">
          <StoryCircles />
          <PostCreationInput onPostCreated={addNewPostToFeed} onSearch={handleSearch} />
          
          {/* Refresh Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Posts ({posts.length})</h2>
            <div className="flex gap-2">
              <button
                onClick={loadAllPosts}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {isRefreshing ? 'Loading...' : 'Load All Posts'}
              </button>
              <button
                onClick={refreshPosts}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
          
          {/* Posts Feed */}
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-500">Loading posts...</div>
            </div>
          ) : posts.length > 0 ? (
            <>
              {posts.map((post) => (
                <SocialPostCard 
                  key={post.postId} 
                  post={post} 
                  onPostDeleted={handlePostDeleted}
                />
              ))}
              
              {/* Load More Button */}
              {hasMorePosts && (
                <div className="flex justify-center py-6">
                  <button
                    onClick={loadMorePosts}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Load More Posts
                  </button>
                </div>
              )}
              
              {!hasMorePosts && posts.length > 0 && (
                <div className="flex justify-center py-6">
                  <div className="text-gray-500 text-sm">All posts loaded ({posts.length} total)</div>
                </div>
              )}
            </>
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
