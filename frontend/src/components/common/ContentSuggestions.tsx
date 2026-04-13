"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPostSuggestionsController } from "@/controllers/postController/postSuggestionsController";
import { getBlogSuggestionsController } from "@/controllers/blog/blogSuggestionsController";
import { Sparkles } from "lucide-react";

interface ContentSuggestionsProps {
  type: "posts" | "articles";
  accessToken: string;
}

interface SuggestionItem {
  id: number;
  title: string;
  summary: string;
  authorName: string;
  authorId?: number;
}

export default function ContentSuggestions({
  type,
  accessToken,
}: ContentSuggestionsProps) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        if (type === "posts") {
          const res = await getPostSuggestionsController(accessToken, 0, 5);
          if (res.success && res.data) {
            const data = res.data as {
              content?: Array<{
                postId: number;
                title: string;
                summary: string;
                author: { username: string };
              }>;
            };
            const items = (data.content || []).slice(0, 5);
            setSuggestions(
              items.map(
                (item: {
                  postId: number;
                  title: string;
                  summary: string;
                  author: { username: string; userId?: number };
                }) => ({
                  id: item.postId,
                  title: item.title,
                  summary: item.summary || "",
                  authorName: item.author?.username || "Unknown",
                  authorId: item.author?.userId,
                })
              )
            );
          }
        } else {
          const res = await getBlogSuggestionsController(accessToken, 0, 5);
          if (res.success && res.data) {
            const items = (res.data.content || []).slice(0, 5);
            setSuggestions(
              items.map((item) => ({
                id: item.blogId,
                title: item.title,
                summary: item.summary || "",
                authorName: item.author?.username || "Unknown",
                authorId: item.author?.userId,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [accessToken, type]);

  const handleClick = (id: number) => {
    if (type === "posts") {
      router.push(`/post/${id}`);
    } else {
      router.push(`/articles/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40 animate-pulse"
          >
            <div className="h-4 bg-cream-300/60 dark:bg-navy-600/60 rounded w-3/4 mb-2" />
            <div className="h-3 bg-cream-300/40 dark:bg-navy-600/40 rounded w-full mb-1.5" />
            <div className="h-3 bg-cream-300/30 dark:bg-navy-600/30 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40 text-center">
        <p className="text-sm text-steel/60 dark:text-sky/40">
          No suggestions available right now.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {suggestions.map((item) => (
        <button
          key={item.id}
          onClick={() => handleClick(item.id)}
          className="w-full text-left p-3 rounded-xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40 hover:bg-cream-200/40 dark:hover:bg-navy-700/50 transition-colors cursor-pointer"
        >
          <h4 className="text-sm font-semibold text-navy dark:text-cream line-clamp-1">
            {item.title}
          </h4>
          {item.summary && (
            <p className="text-xs text-steel/70 dark:text-sky/50 line-clamp-2 mt-1">
              {item.summary.length > 120
                ? item.summary.substring(0, 120) + "..."
                : item.summary}
            </p>
          )}
          <p className="text-[11px] text-steel/50 dark:text-sky/30 mt-1.5">
            by{" "}
            <span
              onClick={(e) => {
                if (item.authorId) {
                  e.stopPropagation();
                  router.push(`/profile/${item.authorId}`);
                }
              }}
              className={item.authorId ? "cursor-pointer hover:underline hover:text-steel dark:hover:text-sky transition-colors" : ""}
            >
              {item.authorName}
            </span>
          </p>
        </button>
      ))}
    </div>
  );
}

export function ContentSuggestionsSection({
  type,
  accessToken,
  title,
}: ContentSuggestionsProps & { title: string }) {
  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-steel dark:text-sky" />
        <h3 className="text-sm font-bold text-navy dark:text-cream tracking-tight">
          {title}
        </h3>
      </div>
      <ContentSuggestions type={type} accessToken={accessToken} />
    </section>
  );
}
