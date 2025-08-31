"use client";

import { Heart, MessageCircle, Bookmark, MoreHorizontal } from "lucide-react";
import { Post } from "@/services/post/fetchPosts";
import { formatDistanceToNow } from "date-fns";

interface SocialPostCardProps {
  post: Post;
}

export function SocialPostCard({ post }: SocialPostCardProps) {
  return (
    <div className="w-full max-w-full mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
            <img
              src={post.author.profilePictureUrl || "/person.jpg"}
              alt={post.author.username}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold text-base text-gray-900 dark:text-white">
              {post.author.username}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800">
          <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 space-y-4">
        {/* Images */}
        {post.thumbnailUrl && (
          <div className="aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
            <img
              src={post.thumbnailUrl}
              alt="Post image"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Text */}
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {post.summary}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-6">
            <button className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-red-500">
              <Heart className="w-4 h-4 mr-2" />
              {post.likeCount || 0} Likes
            </button>
            <button className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500">
              <MessageCircle className="w-4 h-4 mr-2" />
              {post.commentCount || 0} Comments
            </button>
          </div>
          <button className="text-gray-600 dark:text-gray-300 hover:text-yellow-500">
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
