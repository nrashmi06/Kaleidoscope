"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { filterBlogsController } from "@/controllers/blog/blogFilter.controller";
import type { BlogItem } from "@/lib/types/blogFilter.types";
import { Book, Eye, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UserProfileArticlesProps {
  userId: number;
  accessToken: string;
  isOwner: boolean;
  isPrivate: boolean;
  username: string;
}

export function UserProfileArticles({
  userId,
  accessToken,
  isOwner,
  isPrivate,
  username,
}: UserProfileArticlesProps) {
  const router = useRouter();
  const [articles, setArticles] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);

  const fetchArticles = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const result = await filterBlogsController(accessToken, {
        userId,
        page: 0,
        size: 6,
        sort: "createdAt,desc",
      });
      if (result.success) {
        setArticles(result.blogs);
        setTotalElements(result.pagination.totalElements);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [accessToken, userId]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 sm:px-8 pb-6">
        <div className="flex items-center gap-2 mb-5">
          <Book className="w-5 h-5 text-icon-muted" />
          <h2 className="text-lg font-display font-bold text-heading">Articles</h2>
        </div>
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-navy/30 dark:text-cream/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-8 pb-6">
      {/* Divider */}
      <div className="mb-6 h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-display font-bold text-heading flex items-center gap-2">
          <Book className="w-5 h-5 text-icon-muted" />
          Articles
          <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-navy/8 dark:bg-cream/8 text-navy/60 dark:text-cream/50">
            {totalElements}
          </span>
        </h2>
        {isOwner && (
          <button
            onClick={() => router.push("/articles/create")}
            className="h-9 px-4 text-xs font-semibold rounded-full text-on-primary bg-btn-primary hover:bg-btn-primary-hover transition-all cursor-pointer"
          >
            Write Article
          </button>
        )}
      </div>

      {articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-2xl bg-cream-300/20 dark:bg-navy-700/20 border border-border-default">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-surface-hover border border-cream-400/30 dark:border-navy-600/30 mb-4">
            <Eye className="w-6 h-6 text-navy/30 dark:text-cream/25" />
          </div>
          <h3 className="text-base font-semibold text-heading mb-1.5">
            No Articles Yet
          </h3>
          <p className="text-sm text-muted">
            {isOwner
              ? "You haven't written any articles yet."
              : `${username} hasn't written any articles yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div
              key={article.blogId}
              onClick={() => router.push(`/articles/${article.blogId}`)}
              className="flex items-start gap-4 p-4 rounded-2xl bg-cream-50/50 dark:bg-navy-700/20 border border-border-subtle cursor-pointer hover:border-navy/15 dark:hover:border-cream/15 hover:shadow-sm transition-all"
            >
              {article.thumbnailUrl && (
                <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-cream-300/30 dark:bg-navy-700/30">
                  <img
                    src={article.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-heading truncate">
                  {article.title}
                </h3>
                {article.summary && (
                  <p className="text-xs text-navy/45 dark:text-cream/35 line-clamp-1 mt-0.5">
                    {article.summary}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-navy/40 dark:text-cream/30">
                  <span>
                    {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                  </span>
                  {article.categories.map((cat) => (
                    <span key={cat.categoryId}>{cat.name}</span>
                  ))}
                  {article.viewCount > 0 && <span>{article.viewCount} views</span>}
                </div>
              </div>
              <span
                className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  article.blogStatus === "PUBLISHED"
                    ? "bg-green-100/60 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : article.blogStatus === "DRAFT"
                    ? "bg-amber-100/60 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                    : article.blogStatus === "APPROVAL_PENDING"
                    ? "bg-blue-100/60 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : article.blogStatus === "FLAGGED"
                    ? "bg-orange-100/60 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                    : article.blogStatus === "REJECTED"
                    ? "bg-red-100/60 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    : "bg-navy/8 text-navy/60 dark:bg-cream/8 dark:text-cream/50"
                }`}
              >
                {article.blogStatus === "APPROVAL_PENDING" ? "PENDING" : article.blogStatus}
              </span>
            </div>
          ))}

          {totalElements > 6 && (
            <div className="text-center pt-3">
              <button
                onClick={() => router.push("/articles")}
                className="h-10 px-6 text-sm font-semibold rounded-full bg-surface-hover text-sub hover:bg-surface-hover transition-all cursor-pointer"
              >
                View All Articles
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
