"use client";

import { useRouter } from "next/navigation";
import { Post } from "@/services/post/fetchPosts";

interface PostCreationInputProps {
  onPostCreated?: (post: Post) => void;
}

export function PostCreationInput({ onPostCreated }: PostCreationInputProps) {
  const router = useRouter();

  const handleCreatePost = () => {
    // Store the callback in sessionStorage so create-post page can use it
    if (onPostCreated) {
      // We'll implement this in the create-post page
      router.push("/create-post");
    } else {
      router.push("/create-post");
    }
  };

  return (
    <div className="w-full max-w-full mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreatePost}
            className="flex-1 px-4 py-2 rounded-md bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
          >
            What's on your mind?
          </button>
          <button 
            onClick={handleCreatePost}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors"
          >
            Search Post
          </button>
        </div>
      </div>
    </div>
  );
}
