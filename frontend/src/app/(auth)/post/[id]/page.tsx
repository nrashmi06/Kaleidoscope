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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-navy dark:text-cream mb-2">
            Invalid Post ID
          </h1>
          <p className="text-sm text-steel dark:text-sky/60 mb-4">
            The post ID provided is not valid.
          </p>
          <button
            onClick={() => router.push("/feed")}
            className="px-4 py-2 bg-steel text-cream-50 dark:bg-sky dark:text-navy rounded-xl font-medium transition-colors cursor-pointer"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-4 relative">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-steel/[0.04] dark:bg-steel/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-[10%] w-80 h-80 bg-sky/[0.05] dark:bg-sky/[0.02] rounded-full blur-[80px]" />
      </div>

      {/* Back button */}
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-steel dark:text-sky/70 hover:text-navy dark:hover:text-cream transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <PostDetails
        postId={postId}
        accessToken={accessToken}
        onPostNotFound={() => router.push("/404")}
        onAuthError={() => router.push("/login")}
      />
    </div>
  );
}
