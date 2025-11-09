"use client";

import { useParams, useRouter } from "next/navigation";
import { PostDetails } from "@/components/post/PostDetails";
import { useAccessToken } from "@/hooks/useAccessToken";
import { ArrowLeft } from "lucide-react";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accessToken = useAccessToken();
  
  const postId = parseInt(params.id as string);

  if (isNaN(postId) || postId <= 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invalid Post ID
          </h1>
          <p className="text-gray-600 dark:text-neutral-400 mb-4">
            The post ID provided is not valid.
          </p>
          <button
            onClick={() => router.push('/feed')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Feed
          </button>
        </div>
      </div>

      {/* Post content */}
      <div className="py-6">
        <PostDetails 
          postId={postId}
          accessToken={accessToken}
          onPostNotFound={() => router.push('/404')}
          onAuthError={() => router.push('/login')}
        />
      </div>
    </div>
  );
}
