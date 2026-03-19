"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useRouter } from "next/navigation";
import { getSavedPostsController } from "@/controllers/postController/postSaveController";
import { getSavedBlogsController } from "@/controllers/blog/blogSaveController";
import { Bookmark, FileText, Image as ImageIcon, ChevronLeft, ChevronRight, Loader2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tab = "posts" | "articles";

interface SavedItem {
  postId?: number;
  blogId?: number;
  title?: string;
  caption?: string;
  author?: { username: string };
  thumbnailUrl?: string;
}

export default function SavedPage() {
  const accessToken = useAccessToken();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SavedItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchSaved = useCallback(async (tab: Tab, pageNum: number) => {
    if (!accessToken) return;
    setLoading(true);
    try {
      if (tab === "posts") {
        const res = await getSavedPostsController(accessToken, pageNum, 9);
        if (res.success && res.data) {
          setItems(res.data.content);
          setTotalPages(res.data.totalPages);
        } else {
          setItems([]);
          setTotalPages(0);
        }
      } else {
        const res = await getSavedBlogsController(accessToken, pageNum, 9);
        if (res.success && res.data) {
          setItems(res.data.content);
          setTotalPages(res.data.totalPages);
        } else {
          setItems([]);
          setTotalPages(0);
        }
      }
    } catch {
      setItems([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchSaved(activeTab, page);
  }, [activeTab, page, fetchSaved]);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setPage(0);
  };

  return (
    <div className="min-h-screen w-full py-10 px-4 bg-gray-50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
            <Bookmark className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Saved Items</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-neutral-800 pb-2">
          <button
            onClick={() => switchTab("posts")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "posts"
                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                : "text-gray-600 hover:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Posts
          </button>
          <button
            onClick={() => switchTab("articles")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "articles"
                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                : "text-gray-600 hover:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            }`}
          >
            <FileText className="w-4 h-4" /> Articles
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-neutral-800/50 rounded-xl border border-dashed border-gray-300 dark:border-neutral-700">
            <Inbox className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-neutral-300 mb-2">No saved {activeTab}</h3>
            <p className="text-gray-500 dark:text-neutral-400">Items you save will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => {
              const id = activeTab === "posts" ? item.postId : item.blogId;
              const title = item.title || item.caption || "Untitled";
              const author = item.author?.username || "Unknown";
              const thumbnail = item.thumbnailUrl;

              return (
                <div
                  key={id ?? index}
                  onClick={() => router.push(activeTab === "posts" ? `/post/${id}` : `/articles/${id}`)}
                  className="cursor-pointer bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-sm hover:shadow-lg transition-all overflow-hidden"
                >
                  {thumbnail && (
                    <div className="h-40 bg-gray-200 dark:bg-neutral-800 relative">
                      <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 mb-1">{title}</h3>
                    <p className="text-sm text-gray-500 dark:text-neutral-400">by {author}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-sm">
            <Button onClick={() => setPage(page - 1)} disabled={page === 0} variant="outline">
              <ChevronLeft className="w-4 h-4 mr-2" /> Previous
            </Button>
            <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">
              Page {page + 1} of {totalPages}
            </span>
            <Button onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1} variant="outline">
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
