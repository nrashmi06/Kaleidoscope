import React from "react";
import Image from "next/image";
import { Eye, Heart, MessageCircle, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import type { BlogAuthor, CategorySummary } from "@/lib/types/blogFilter.types";

interface ArticleCardProps {
  title: string;
  summary?: string;
  author?: BlogAuthor;
  categories?: CategorySummary[];
  thumbnailUrl?: string;
  views: number;
  reactionCount?: number;
  commentCount?: number;
  createdAt?: string;
  blogId?: number;
  onClick?: () => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  title,
  summary,
  author,
  categories,
  thumbnailUrl,
  views,
  reactionCount = 0,
  commentCount = 0,
  createdAt,
  onClick,
}) => {
  const router = useRouter();
  const timeAgo = createdAt
    ? formatDistanceToNow(new Date(createdAt), { addSuffix: true })
    : null;

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col h-[22rem] rounded-2xl overflow-hidden bg-cream-50 dark:bg-navy-700/50 border border-cream-300/40 dark:border-navy-700/40 hover:border-steel/30 dark:hover:border-sky/30 shadow-sm hover:shadow-lg hover:shadow-steel/[0.06] dark:hover:shadow-sky/[0.04] transition-all duration-300 cursor-pointer"
    >
      {/* Thumbnail / Cover */}
      <div className="relative h-[45%] w-full overflow-hidden bg-cream-300/30 dark:bg-navy-700/60">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-steel/10 to-sky/10 dark:from-steel/20 dark:to-sky/10">
            <div className="w-14 h-14 rounded-2xl bg-steel/10 dark:bg-sky/10 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-steel/40 dark:text-sky/30"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
          </div>
        )}

        {/* View count badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-navy/60 backdrop-blur-sm text-cream-50 text-[11px] font-medium">
          <Eye className="w-3 h-3" />
          {views}
        </div>

        {/* Categories */}
        {categories && categories.length > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
            {categories.slice(0, 2).map((cat) => (
              <span
                key={cat.categoryId}
                className="px-2 py-0.5 rounded-md bg-steel/70 backdrop-blur-sm text-cream-50 text-[10px] font-semibold uppercase tracking-wide"
              >
                {cat.name}
              </span>
            ))}
            {categories.length > 2 && (
              <span className="px-1.5 py-0.5 rounded-md bg-navy/50 backdrop-blur-sm text-cream-50 text-[10px] font-medium">
                +{categories.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-sm font-bold text-navy dark:text-cream leading-snug line-clamp-2 group-hover:text-steel dark:group-hover:text-sky transition-colors">
          {title}
        </h3>

        {summary && (
          <p className="mt-1.5 text-[12px] text-steel/70 dark:text-sky/50 leading-relaxed line-clamp-2">
            {summary}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer: author + stats */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-cream-300/30 dark:border-navy-600/30">
          {/* Author */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-cream-300 dark:bg-navy-600 flex-shrink-0 flex items-center justify-center">
              {author?.profilePictureUrl ? (
                <Image
                  src={author.profilePictureUrl}
                  alt={author.username}
                  width={24}
                  height={24}
                  className="object-cover w-full h-full"
                />
              ) : (
                <User className="w-3 h-3 text-steel/60 dark:text-sky/40" />
              )}
            </div>
            <div className="min-w-0">
              <p
                onClick={(e) => {
                  if (author?.userId) {
                    e.stopPropagation();
                    router.push(`/profile/${author.userId}`);
                  }
                }}
                className={`text-[11px] font-medium text-navy/80 dark:text-cream/70 truncate ${
                  author?.userId ? "cursor-pointer hover:underline hover:text-steel dark:hover:text-sky" : ""
                }`}
              >
                {author?.username || "Anonymous"}
              </p>
              {timeAgo && (
                <p className="text-[10px] text-steel/50 dark:text-sky/30">
                  {timeAgo}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] text-steel/60 dark:text-sky/40">
              <Heart className="w-3 h-3" />
              {reactionCount}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-steel/60 dark:text-sky/40">
              <MessageCircle className="w-3 h-3" />
              {commentCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
