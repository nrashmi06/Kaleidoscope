import React from "react";
import Image from "next/image";
import { Eye, Heart, MessageCircle, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { parseUTC } from "@/lib/utils/parseUTC";
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

const PIN_ASPECTS = [
  "aspect-[3/4]",
  "aspect-[4/5]",
  "aspect-[1/1]",
  "aspect-[4/3]",
  "aspect-[2/3]",
];

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
  blogId,
  onClick,
}) => {
  const router = useRouter();
  const timeAgo = createdAt
    ? formatDistanceToNow(parseUTC(createdAt), { addSuffix: true })
    : null;

  const aspectClass = PIN_ASPECTS[(blogId ?? 0) % PIN_ASPECTS.length];

  return (
    <div
      onClick={onClick}
      className="group relative w-full cursor-pointer"
    >
      {/* Pin image */}
      {thumbnailUrl ? (
        <div
          className={`relative w-full ${aspectClass} overflow-hidden rounded-2xl bg-cream-300/20 dark:bg-navy-700/20`}
        >
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          {/* View count badge */}
          {views > 0 && (
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">
              <Eye className="w-3 h-3" />
              {views}
            </div>
          )}

          {/* Categories — bottom-left */}
          {categories && categories.length > 0 && (
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {categories.slice(0, 2).map((cat) => (
                <span
                  key={cat.categoryId}
                  className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-white text-[10px] font-semibold"
                >
                  {cat.name}
                </span>
              ))}
              {categories.length > 2 && (
                <span className="px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium">
                  +{categories.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        /* No-thumbnail pin */
        <div className="rounded-2xl bg-gradient-to-br from-cream-300/40 to-cream-200/20 dark:from-navy-700/50 dark:to-navy-600/20 p-5 min-h-[140px] flex flex-col justify-end">
          <h3 className="text-base font-bold text-heading leading-snug line-clamp-4">
            {title}
          </h3>
          {summary && (
            <p className="mt-1.5 text-xs text-sub leading-relaxed line-clamp-2">
              {summary}
            </p>
          )}
        </div>
      )}

      {/* Content below pin */}
      <div className="px-1 pt-2.5 pb-1 space-y-1">
        {thumbnailUrl && (
          <h3 className="text-[13px] font-semibold text-heading leading-snug line-clamp-2 group-hover:text-steel dark:group-hover:text-sky transition-colors">
            {title}
          </h3>
        )}

        {/* Author + stats row */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="w-5 h-5 rounded-full overflow-hidden bg-cream-300 dark:bg-navy-600 flex-shrink-0 flex items-center justify-center">
              {author?.profilePictureUrl ? (
                <Image
                  src={author.profilePictureUrl}
                  alt={author.username}
                  width={20}
                  height={20}
                  className="object-cover w-full h-full"
                />
              ) : (
                <User className="w-2.5 h-2.5 text-steel/60 dark:text-sky/40" />
              )}
            </div>
            <span
              onClick={(e) => {
                if (author?.userId) {
                  e.stopPropagation();
                  router.push(`/profile/${author.userId}`);
                }
              }}
              className={`text-[11px] font-medium text-sub truncate ${
                author?.userId ? "cursor-pointer hover:text-steel dark:hover:text-sky" : ""
              }`}
            >
              {author?.username || "Anonymous"}
            </span>
          </div>

          {/* Compact stats */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {reactionCount > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-steel/40 dark:text-sky/30">
                <Heart className="w-2.5 h-2.5" />
                {reactionCount}
              </span>
            )}
            {commentCount > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-steel/40 dark:text-sky/30">
                <MessageCircle className="w-2.5 h-2.5" />
                {commentCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
