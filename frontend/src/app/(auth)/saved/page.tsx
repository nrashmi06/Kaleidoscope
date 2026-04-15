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
    <div className="w-full">
      {/* ── Header Section ── */}
      <div className="pt-6 pb-5 px-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-navy dark:text-cream tracking-tight">
              Saved
            </h1>
            {!loading && items.length > 0 && (
              <p className="mt-1 text-sm text-steel/50 dark:text-sky/35 tabular-nums">
                {items.length} items
                {totalPages > 1 && ` · Page ${page + 1} of ${totalPages}`}
              </p>
            )}
          </div>

          {/* Tabs — segmented control */}
          <div className="inline-flex p-1 rounded-full bg-cream-300/50 dark:bg-navy-700/50">
            <button
              onClick={() => switchTab("posts")}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium rounded-full transition-all duration-300 cursor-pointer ${
                activeTab === "posts"
                  ? "bg-navy text-cream dark:bg-cream dark:text-navy shadow-sm"
                  : "text-navy/50 dark:text-cream/50 hover:text-navy dark:hover:text-cream"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Posts
            </button>
            <button
              onClick={() => switchTab("articles")}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium rounded-full transition-all duration-300 cursor-pointer ${
                activeTab === "articles"
                  ? "bg-navy text-cream dark:bg-cream dark:text-navy shadow-sm"
                  : "text-navy/50 dark:text-cream/50 hover:text-navy dark:hover:text-cream"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Articles
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-[16rem] rounded-2xl bg-cream-300/30 dark:bg-navy-700/30 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 px-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-cream-300/30 dark:bg-navy-700/30 mb-5">
            <Inbox className="w-6 h-6 text-navy/25 dark:text-cream/25" />
          </div>
          <h3 className="text-lg font-display font-semibold text-navy dark:text-cream mb-2">
            No saved {activeTab}
          </h3>
          <p className="text-sm text-navy/40 dark:text-cream/35">
            Items you save will appear here.
          </p>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
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
                    className="group flex flex-col h-[16rem] rounded-2xl overflow-hidden bg-cream-50 dark:bg-navy-800/50 hover:shadow-lg hover:shadow-black/[0.06] dark:hover:shadow-black/20 transition-all duration-300 cursor-pointer"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-[55%] w-full overflow-hidden bg-cream-300/30 dark:bg-navy-700/30">
                      {thumbnail ? (
                        <Image
                          src={thumbnail}
                          alt={title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          {activeTab === "posts" ? (
                            <ImageIcon className="w-8 h-8 text-navy/15 dark:text-cream/10" />
                          ) : (
                            <FileText className="w-8 h-8 text-navy/15 dark:text-cream/10" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-4">
                      <h3 className="text-sm font-semibold text-navy dark:text-cream leading-snug line-clamp-2">
                        {title}
                      </h3>

                      <div className="flex-1" />

                      {/* Author */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-5 h-5 rounded-full bg-cream-300/50 dark:bg-navy-700/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.author?.profilePictureUrl ? (
                            <Image
                              src={item.author.profilePictureUrl}
                              alt={author}
                              width={20}
                              height={20}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <User className="w-2.5 h-2.5 text-navy/30 dark:text-cream/25" />
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-navy/50 dark:text-cream/45 truncate">
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
        <div className="mt-12 flex items-center justify-center gap-1">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 0}
            className="flex items-center justify-center w-10 h-10 rounded-full text-navy/50 dark:text-cream/40 hover:text-navy dark:hover:text-cream hover:bg-cream-300/40 dark:hover:bg-navy-700/40 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {getPageNumbers().map((p, idx) =>
            p === "..." ? (
              <span
                key={`dots-${idx}`}
                className="w-10 h-10 flex items-center justify-center text-sm text-navy/25 dark:text-cream/20"
              >
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => handlePageChange(p as number)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                  page === p
                    ? "bg-navy dark:bg-cream text-cream-50 dark:text-navy"
                    : "text-navy/50 dark:text-cream/40 hover:text-navy dark:hover:text-cream hover:bg-cream-300/40 dark:hover:bg-navy-700/40"
                }`}
              >
                {(p as number) + 1}
              </button>
            )
          )}

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="flex items-center justify-center w-10 h-10 rounded-full text-navy/50 dark:text-cream/40 hover:text-navy dark:hover:text-cream hover:bg-cream-300/40 dark:hover:bg-navy-700/40 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
