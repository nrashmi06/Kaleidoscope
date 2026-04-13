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
      <div className="px-6 sm:px-8 pb-6">
        <div className="flex items-center gap-2 mb-5">
          <Book className="w-5 h-5 text-steel dark:text-sky" />
          <h2 className="text-lg font-bold text-navy dark:text-cream">Articles</h2>
        </div>
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-steel dark:text-sky" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 sm:px-8 pb-6">
      {/* Divider */}
      <div className="mb-6 h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-navy dark:text-cream flex items-center gap-2">
          <Book className="w-5 h-5 text-steel dark:text-sky" />
          Articles
          <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-steel/10 dark:bg-sky/10 text-steel dark:text-sky">
            {totalElements}
          </span>
        </h2>
        {isOwner && (
          <button
            onClick={() => router.push("/articles/create")}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-steel text-cream-50 dark:bg-sky dark:text-navy hover:bg-steel-600 dark:hover:bg-sky/80 transition-colors cursor-pointer"
          >
            Write Article
          </button>
        )}
      </div>

      {articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-2xl border border-dashed border-cream-300 dark:border-navy-700 bg-cream-50/50 dark:bg-navy/50 backdrop-blur-sm">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cream-300/50 dark:bg-navy-700/50 border border-cream-400/40 dark:border-navy-600/40 mb-4">
            <Eye className="w-6 h-6 text-steel dark:text-sky/60" />
          </div>
          <h3 className="text-base font-semibold text-navy dark:text-cream mb-1.5">
            No Articles Yet
          </h3>
          <p className="text-sm text-steel dark:text-sky/60">
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
              className="flex items-start gap-4 p-4 rounded-2xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40 cursor-pointer hover:border-steel/20 dark:hover:border-sky/20 transition-all"
            >
              {article.thumbnailUrl && (
                <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-cream-300/40 dark:bg-navy-700/40">
                  <img
                    src={article.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-navy dark:text-cream truncate">
                  {article.title}
                </h3>
                {article.summary && (
                  <p className="text-xs text-steel/60 dark:text-sky/40 line-clamp-1 mt-0.5">
                    {article.summary}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-steel/50 dark:text-sky/35">
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
                    : "bg-steel/10 text-steel dark:bg-sky/10 dark:text-sky"
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
                className="px-6 py-2 text-sm font-semibold rounded-xl bg-steel/10 dark:bg-sky/10 text-steel dark:text-sky hover:bg-steel/20 dark:hover:bg-sky/20 transition-all cursor-pointer"
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
