"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccessToken } from "@/hooks/useAccessToken";
import { getBlogByIdController } from "@/controllers/blog/getBlogByIdController";
import { BlogRequest } from "@/lib/types/createBlog";
import BlogForm from "@/components/articles/BlogForm";
import { Loader2 } from "lucide-react";

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
            className="px-4 py-2 bg-steel text-cream-50 dark:bg-sky dark:text-navy rounded-xl font-medium"
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
          <Loader2 className="w-8 h-8 animate-spin text-steel dark:text-sky" />
          <p className="text-sm text-steel dark:text-sky/60">
            Loading article...
          </p>
        </div>
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center p-8 bg-cream-50 dark:bg-navy-700/50 rounded-2xl border border-cream-300/40 dark:border-navy-700/40 max-w-lg">
          <h3 className="text-lg font-bold mb-2 text-navy dark:text-cream">
            Error Loading Article
          </h3>
          <p className="text-sm text-steel dark:text-sky/60 mb-6">{error}</p>
          <button
            onClick={() => router.push("/articles")}
            className="px-6 py-2 bg-steel text-cream-50 dark:bg-sky dark:text-navy rounded-xl font-semibold"
          >
            Back to Articles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <BlogForm editBlogId={blogId} initialData={initialData} />
    </div>
  );
}
