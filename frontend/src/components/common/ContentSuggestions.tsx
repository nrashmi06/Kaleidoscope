"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getPostSuggestionsController } from "@/controllers/postController/postSuggestionsController";
import { getBlogSuggestionsController } from "@/controllers/blog/blogSuggestionsController";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { Sparkles, Heart, MessageCircle, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { BlogItem } from "@/lib/types/blogFilter.types";

interface ContentSuggestionsProps {
  type: "posts" | "articles";
  accessToken: string;
}

interface PostSuggestion {
  postId: number;
  title: string;
  summary: string;
  createdAt: string;
  author: {
    userId: number;
    username: string;
    profilePictureUrl?: string;
  };
  thumbnailUrl?: string;
  mediaDetails?: Array<{ url: string; mediaType: string }>;
  commentCount: number;
  reactionCount: number;
  viewCount: number;
}

export default function ContentSuggestions({
  type,
  accessToken,
}: ContentSuggestionsProps) {
  const router = useRouter();
  const [blogSuggestions, setBlogSuggestions] = useState<BlogItem[]>([]);
  const [postSuggestions, setPostSuggestions] = useState<PostSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        if (type === "posts") {
          const res = await getPostSuggestionsController(accessToken, 0, 5);
          if (res.success && res.data) {
            const data = res.data as { content?: PostSuggestion[] };
            setPostSuggestions((data.content || []).slice(0, 5));
          }
        } else {
          const res = await getBlogSuggestionsController(accessToken, 0, 5);
          if (res.success && res.data) {
            setBlogSuggestions((res.data.content || []).slice(0, 5));
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[22rem] rounded-2xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40 animate-pulse"
          >
            <div className="h-[45%] bg-cream-300/40 dark:bg-navy-600/40 rounded-t-2xl" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-cream-300/60 dark:bg-navy-600/60 rounded w-3/4" />
              <div className="h-3 bg-cream-300/40 dark:bg-navy-600/40 rounded w-full" />
              <div className="h-3 bg-cream-300/30 dark:bg-navy-600/30 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "articles") {
    if (blogSuggestions.length === 0) {
      return (
        <div className="p-4 rounded-xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40 text-center">
          <p className="text-sm text-steel/60 dark:text-sky/40">
            No suggestions available right now.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {blogSuggestions.map((blog) => (
          <ArticleCard
            key={blog.blogId}
            title={blog.title}
            summary={blog.summary}
            author={blog.author}
            categories={blog.categories}
            thumbnailUrl={blog.thumbnailUrl}
            views={blog.viewCount}
            reactionCount={blog.reactionCount}
            commentCount={blog.commentCount}
            createdAt={blog.createdAt}
            blogId={blog.blogId}
            onClick={() => router.push(`/articles/${blog.blogId}`)}
          />
        ))}
      </div>
    );
  }

  // Post suggestions
  if (postSuggestions.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40 text-center">
        <p className="text-sm text-steel/60 dark:text-sky/40">
          No suggestions available right now.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {postSuggestions.map((post) => {
        const thumbnail =
          post.thumbnailUrl ||
          post.mediaDetails?.find((m) => m.mediaType === "IMAGE")?.url;
        const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
          addSuffix: true,
        });

        return (
          <div
            key={post.postId}
            onClick={() => router.push(`/post/${post.postId}`)}
            className="group relative flex flex-col h-[22rem] rounded-2xl overflow-hidden bg-cream-50 dark:bg-navy-700/50 border border-cream-300/40 dark:border-navy-700/40 hover:border-steel/30 dark:hover:border-sky/30 shadow-sm hover:shadow-lg hover:shadow-steel/[0.06] dark:hover:shadow-sky/[0.04] transition-all duration-300 cursor-pointer"
          >
            {/* Thumbnail */}
            <div className="relative h-[45%] w-full overflow-hidden bg-cream-300/30 dark:bg-navy-700/60">
              {thumbnail ? (
                <Image
                  src={thumbnail}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-steel/10 to-sky/10 dark:from-steel/20 dark:to-sky/10">
                  <div className="w-14 h-14 rounded-2xl bg-steel/10 dark:bg-sky/10 flex items-center justify-center">
                    <Eye className="w-7 h-7 text-steel/40 dark:text-sky/30" />
                  </div>
                </div>
              )}

              {post.viewCount > 0 && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-navy/60 backdrop-blur-sm text-cream-50 text-[11px] font-medium">
                  <Eye className="w-3 h-3" />
                  {post.viewCount}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-4">
              <h3 className="text-sm font-bold text-navy dark:text-cream leading-snug line-clamp-2 group-hover:text-steel dark:group-hover:text-sky transition-colors">
                {post.title}
              </h3>

              {post.summary && (
                <p className="mt-1.5 text-[12px] text-steel/70 dark:text-sky/50 leading-relaxed line-clamp-2">
                  {post.summary}
                </p>
              )}

              <div className="flex-1" />

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-cream-300/30 dark:border-navy-600/30">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-cream-300 dark:bg-navy-600 flex-shrink-0">
                    <Image
                      src={post.author.profilePictureUrl || "/person.jpg"}
                      alt={post.author.username}
                      width={24}
                      height={24}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/profile/${post.author.userId}`);
                      }}
                      className="text-[11px] font-medium text-navy/80 dark:text-cream/70 truncate cursor-pointer hover:underline hover:text-steel dark:hover:text-sky"
                    >
                      {post.author.username}
                    </p>
                    <p className="text-[10px] text-steel/50 dark:text-sky/30">
                      {timeAgo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[11px] text-steel/60 dark:text-sky/40">
                    <Heart className="w-3 h-3" />
                    {post.reactionCount}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-steel/60 dark:text-sky/40">
                    <MessageCircle className="w-3 h-3" />
                    {post.commentCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
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
