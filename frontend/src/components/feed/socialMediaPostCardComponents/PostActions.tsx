"use client";
import { Heart, MessageCircle, Bookmark, Users } from "lucide-react";
import { Post } from "@/services/post/fetchPosts";

export function PostActions({ post }: { post: Post }) {
  return (
    <div className="flex items-center justify-between pt-2">
      <div className="flex items-center space-x-6">
        <button className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-red-500">
          <Heart className="w-4 h-4 mr-2" /> {post.likeCount || 0} Likes
        </button>
        <button className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500">
          <MessageCircle className="w-4 h-4 mr-2" /> {post.commentCount || 0} Comments
        </button>
        {post.taggedUsers && post.taggedUsers.length > 0 && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Users className="w-4 h-4 mr-2" /> {post.taggedUsers.length} Tagged
          </div>
        )}
      </div>
      <button className="text-gray-600 dark:text-gray-300 hover:text-yellow-500">
        <Bookmark className="w-4 h-4" />
      </button>
    </div>
  );
}
