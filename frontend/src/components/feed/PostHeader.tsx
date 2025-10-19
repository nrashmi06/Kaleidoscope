"use client";
import { MoreHorizontal, Trash2, MapPin } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { Post } from "@/services/post/fetchPosts";

interface PostHeaderProps {
  post: Post;
  canDelete: boolean;
  onDelete: () => void;
}

export function PostHeader({ post, canDelete, onDelete }: PostHeaderProps) {
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const deleteMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (deleteMenuRef.current && !deleteMenuRef.current.contains(e.target as Node)) {
        setShowDeleteMenu(false);
      }
    };
    if (showDeleteMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDeleteMenu]);

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden relative">
          <Image
            src={post.author.profilePictureUrl || "/person.jpg"}
            alt={post.author.username}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
        <div>
          <h3 className="font-semibold text-base text-gray-900 dark:text-white">{post.author.username}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
            {post.location && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{post.location.name}, {post.location.city}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {canDelete && (
        <div className="relative" ref={deleteMenuRef}>
          <button onClick={() => setShowDeleteMenu(!showDeleteMenu)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800">
            <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
          {showDeleteMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg z-10 min-w-[120px]">
              <button onClick={onDelete} className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm transition-colors">
                <Trash2 className="w-4 h-4" /> Delete Post
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
