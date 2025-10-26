"use client";

import { useState, useEffect, useCallback } from "react";
import { filterPostsController } from "@/controllers/postController/filterPosts";
import { Post } from "@/services/post/fetchPosts";
import { useAccessToken } from "@/hooks/useAccessToken";

export const useFeedPosts = () => {
  const accessToken = useAccessToken();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  /** Fetch posts (initial + pagination) */
  const fetchPosts = useCallback(
    async (page = 0) => {
      if (!accessToken) return;
      setIsLoading(true);
      try {
        const result = await filterPostsController(accessToken, {
          page,
          size: 6,
          sort: "createdAt,desc",
          q: searchQuery || undefined,
        });

        if (!result.success || !result.data || !result.data.data) return;

        const { content, last } = result.data.data;
        setPosts((prev) => (page === 0 ? content : [...prev, ...content]));
        setHasMorePosts(!last);
        setCurrentPage(page);
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, searchQuery]
  );

  /** Fetch on mount */
  useEffect(() => {
    if (!accessToken) return;
    fetchPosts(0);
  }, [accessToken, fetchPosts]);

  /** Refresh posts */
  const refreshPosts = useCallback(async () => {
    if (!accessToken) return;
    setIsRefreshing(true);
    try {
      await fetchPosts(0);
    } finally {
      setIsRefreshing(false);
    }
  }, [accessToken, fetchPosts]);

  /** Load next page */
  const loadMorePosts = useCallback(async () => {
    if (!accessToken || !hasMorePosts) return;
    const nextPage = currentPage + 1;
    await fetchPosts(nextPage);
  }, [accessToken, hasMorePosts, currentPage, fetchPosts]);

  /** Load all posts (for admins, etc.) */
  const loadAllPosts = useCallback(async () => {
    if (!accessToken) return;
    setIsRefreshing(true);
    try {
      await fetchPosts(0);
    } finally {
      setIsRefreshing(false);
    }
  }, [accessToken, fetchPosts]);

  /** Search posts */
  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (!accessToken) return;
      const result = await filterPostsController(accessToken, {
        page: 0,
        size: 50,
        sort: "createdAt,desc",
        q: query || undefined,
      });
      if (result.success && result.data) {
        setPosts(result.data.data.content);
        setHasMorePosts(result.data.data.totalPages > 1);
        setCurrentPage(0);
      }
    },
    [accessToken]
  );

  /** Delete or add new post in feed */
  const handlePostDeleted = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => p.postId.toString() !== id));
  }, []);

  const addNewPostToFeed = useCallback((post: Post) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  return {
    posts,
    isLoading,
    isRefreshing,
    hasMorePosts,
    searchQuery,
    handlers: {
      refreshPosts,
      loadMorePosts,
      loadAllPosts,
      handleSearch,
      addNewPostToFeed,
      handlePostDeleted,
    },
  };
};
