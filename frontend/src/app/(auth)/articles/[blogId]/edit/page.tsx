"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccessToken } from "@/hooks/useAccessToken";
import { getBlogByIdController } from "@/controllers/blog/getBlogByIdController";
import { BlogRequest } from "@/lib/types/createBlog";
import BlogForm from "@/components/articles/BlogForm";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function EditBlogPage() {
  const params = useParams();
  const router = useRouter();
  const accessToken = useAccessToken();
  const blogId = parseInt(params.blogId as string);

  const [initialData, setInitialData] = useState<BlogRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || isNaN(blogId) || blogId <= 0) return;

    const fetchBlog = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getBlogByIdController(accessToken, blogId);
        if (res.success && res.data) {
          const blog = res.data;
          setInitialData({
            title: blog.title,
            body: blog.body,
            summary: blog.summary,
            categoryIds: blog.categories.map((c) => c.categoryId),
            blogTagIds: blog.blogTags.map((t) => t.blogId),
            locationId: blog.location?.locationId,
            mediaDetails: blog.media.map((m) => ({
              mediaId: m.mediaId,
              url: m.mediaUrl,
              mediaType: m.mediaType,
              position: m.position,
              width: m.width,
              height: m.height,
              fileSizeKb: m.fileSizeKb,
              durationSeconds: m.durationSeconds,
              extraMetadata: m.extraMetadata,
            })),
          });
        } else {
          setError(res.message || "Failed to load article.");
        }
      } catch {
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [accessToken, blogId]);

  if (isNaN(blogId) || blogId <= 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-navy dark:text-cream mb-2">
            Invalid Article ID
          </h1>
          <button
            onClick={() => router.push("/articles")}
            className="px-5 py-2 bg-navy text-cream-50 dark:bg-cream dark:text-navy rounded-full font-medium hover:bg-navy/90 dark:hover:bg-cream/90 transition-colors cursor-pointer"
          >
            Back to Articles
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-navy/40 dark:text-cream/40" />
          <p className="text-sm text-navy/50 dark:text-cream/40">
            Loading article...
          </p>
        </div>
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center p-8 bg-cream-50 dark:bg-navy-700/30 rounded-2xl border border-cream-300/40 dark:border-navy-700/40 max-w-lg">
          <h3 className="text-lg font-bold mb-2 text-navy dark:text-cream">
            Error Loading Article
          </h3>
          <p className="text-sm text-navy/50 dark:text-cream/40 mb-6">{error}</p>
          <button
            onClick={() => router.push("/articles")}
            className="px-6 py-2 bg-navy text-cream-50 dark:bg-cream dark:text-navy rounded-full font-semibold hover:bg-navy/90 dark:hover:bg-cream/90 transition-colors cursor-pointer"
          >
            Back to Articles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-cream-50 dark:bg-navy-700/50 border border-cream-300/40 dark:border-navy-700/40 hover:bg-cream-300/30 dark:hover:bg-navy-600/40 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-navy/60 dark:text-cream/50" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-navy dark:text-cream">
              Edit Article
            </h1>
            <p className="text-navy/50 dark:text-cream/40 text-sm">
              Update your article details
            </p>
          </div>
        </div>

        <BlogForm editBlogId={blogId} initialData={initialData} />
      </div>
    </div>
  );
}
