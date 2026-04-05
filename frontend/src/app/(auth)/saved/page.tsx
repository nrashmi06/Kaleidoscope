"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useRouter } from "next/navigation";
import { getSavedPostsController } from "@/controllers/postController/postSaveController";
import { getSavedBlogsController } from "@/controllers/blog/blogSaveController";
import {
  Bookmark,
  FileText,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Inbox,
  User,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "posts" | "articles";

interface SavedItem {
  postId?: number;
  blogId?: number;
  title?: string;
  caption?: string;
  author?: { username: string; profilePictureUrl?: string };
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

  const fetchSaved = useCallback(
    async (tab: Tab, pageNum: number) => {
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
    },
    [accessToken]
  );

  useEffect(() => {
    fetchSaved(activeTab, page);
  }, [activeTab, page, fetchSaved]);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setPage(0);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  // Generate visible page numbers
  const getPageNumbers = () => {
    const total = totalPages;
    const current = page;
    const pages: (number | "...")[] = [];

    if (total <= 5) {
      for (let i = 0; i < total; i++) pages.push(i);
    } else {
      pages.push(0);
      if (current > 2) pages.push("...");
      for (
        let i = Math.max(1, current - 1);
        i <= Math.min(total - 2, current + 1);
        i++
      ) {
        pages.push(i);
      }
      if (current < total - 3) pages.push("...");
      pages.push(total - 1);
    }
    return pages;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 relative">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-steel/[0.04] dark:bg-steel/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-[10%] w-80 h-80 bg-sky/[0.05] dark:bg-sky/[0.02] rounded-full blur-[80px]" />
      </div>

      {/* ── Header Section ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-steel to-steel-600 shadow-lg shadow-steel/25 dark:shadow-steel/15 dark:from-sky dark:to-steel">
            <Bookmark className="w-5 h-5 text-cream-50" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-navy dark:text-cream tracking-tight">
              Saved
            </h1>
            {!loading && items.length > 0 && (
              <p className="text-[11px] text-steel dark:text-sky/60 tabular-nums">
                {items.length} items
                {totalPages > 1 && ` · Page ${page + 1} of ${totalPages}`}
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => switchTab("posts")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "posts"
                ? "bg-steel text-cream-50 shadow-sm shadow-steel/20 dark:bg-sky dark:text-navy dark:shadow-sky/15"
                : "text-navy/70 dark:text-cream/60 hover:bg-cream-300/40 dark:hover:bg-navy-700/40"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Posts
          </button>
          <button
            onClick={() => switchTab("articles")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "articles"
                ? "bg-steel text-cream-50 shadow-sm shadow-steel/20 dark:bg-sky dark:text-navy dark:shadow-sky/15"
                : "text-navy/70 dark:text-cream/60 hover:bg-cream-300/40 dark:hover:bg-navy-700/40"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Articles
          </button>
        </div>

        {/* Gradient divider */}
        <div className="mt-5 h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-[16rem] rounded-2xl bg-cream-300/40 dark:bg-navy-700/40 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-cream-300 dark:border-navy-700 bg-cream-50/50 dark:bg-navy/50 backdrop-blur-sm">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cream-300/50 dark:bg-navy-700/50 border border-cream-400/40 dark:border-navy-600/40 mb-4">
            <Inbox className="w-6 h-6 text-steel dark:text-sky/60" />
          </div>
          <h3 className="text-base font-semibold text-navy dark:text-cream mb-1.5">
            No saved {activeTab}
          </h3>
          <p className="text-sm text-steel dark:text-sky/60">
            Items you save will appear here.
          </p>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          >
            {items.map((item, index) => {
              const id =
                activeTab === "posts" ? item.postId : item.blogId;
              const title = item.title || item.caption || "Untitled";
              const author = item.author?.username || "Unknown";
              const thumbnail = item.thumbnailUrl;

              return (
                <motion.div
                  key={id ?? index}
                  layout
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.97 }}
                  transition={{
                    duration: 0.35,
                    delay: index * 0.04,
                    ease: "easeOut",
                  }}
                >
                  <div
                    onClick={() =>
                      router.push(
                        activeTab === "posts"
                          ? `/post/${id}`
                          : `/articles/${id}`
                      )
                    }
                    className="group flex flex-col h-[16rem] rounded-2xl overflow-hidden bg-cream-50 dark:bg-navy-700/50 border border-cream-300/40 dark:border-navy-700/40 hover:border-steel/30 dark:hover:border-sky/30 shadow-sm hover:shadow-lg hover:shadow-steel/[0.06] dark:hover:shadow-sky/[0.04] transition-all duration-300 cursor-pointer"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-[55%] w-full overflow-hidden bg-cream-300/30 dark:bg-navy-700/60">
                      {thumbnail ? (
                        <Image
                          src={thumbnail}
                          alt={title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-steel/10 to-sky/10 dark:from-steel/20 dark:to-sky/10">
                          {activeTab === "posts" ? (
                            <ImageIcon className="w-8 h-8 text-steel/30 dark:text-sky/20" />
                          ) : (
                            <FileText className="w-8 h-8 text-steel/30 dark:text-sky/20" />
                          )}
                        </div>
                      )}

                      {/* Type badge */}
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-navy/60 backdrop-blur-sm text-cream-50 text-[10px] font-semibold uppercase tracking-wide">
                        {activeTab === "posts" ? "Post" : "Article"}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-4">
                      <h3 className="text-sm font-bold text-navy dark:text-cream leading-snug line-clamp-2 group-hover:text-steel dark:group-hover:text-sky transition-colors">
                        {title}
                      </h3>

                      <div className="flex-1" />

                      {/* Author */}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-cream-300/30 dark:border-navy-600/30">
                        <div className="w-5 h-5 rounded-full bg-cream-300 dark:bg-navy-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.author?.profilePictureUrl ? (
                            <Image
                              src={item.author.profilePictureUrl}
                              alt={author}
                              width={20}
                              height={20}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <User className="w-2.5 h-2.5 text-steel/60 dark:text-sky/40" />
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-navy/70 dark:text-cream/60 truncate">
                          {author}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Pagination ── */}
      {!loading && items.length > 0 && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-1.5">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 0}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-steel dark:text-sky/70 hover:bg-cream-300/40 dark:hover:bg-navy-700/40 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPageNumbers().map((p, idx) =>
            p === "..." ? (
              <span
                key={`dots-${idx}`}
                className="w-9 h-9 flex items-center justify-center text-xs text-steel/50 dark:text-sky/30"
              >
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => handlePageChange(p as number)}
                className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  page === p
                    ? "bg-steel text-cream-50 shadow-sm shadow-steel/20 dark:bg-sky dark:text-navy dark:shadow-sky/15"
                    : "text-navy/70 dark:text-cream/60 hover:bg-cream-300/40 dark:hover:bg-navy-700/40"
                }`}
              >
                {(p as number) + 1}
              </button>
            )
          )}

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-steel dark:text-sky/70 hover:bg-cream-300/40 dark:hover:bg-navy-700/40 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
