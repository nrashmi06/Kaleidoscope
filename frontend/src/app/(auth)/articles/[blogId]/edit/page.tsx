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
            title: blog.title ?? "",
            body: blog.body ?? "",
            summary: blog.summary ?? "",
            categoryIds: (blog.categories ?? []).map((c) => c.categoryId),
            blogTagIds: (blog.blogTags ?? []).map((t) => t.blogId),
            locationId: blog.location?.locationId,
            mediaDetails: (blog.media ?? []).map((m) => ({
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
      } catch (err) {
        console.error("Edit page fetch error:", err);
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
          <h1 className="text-2xl font-bold text-heading mb-2">
            Invalid Article ID
          </h1>
          <button
            onClick={() => router.push("/articles")}
            className="px-5 py-2 bg-btn-primary text-on-primary rounded-full font-medium cursor-pointer"
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
          <p className="text-sm text-muted">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center p-8 bg-surface-alt rounded-2xl border border-border-default max-w-lg">
          <h3 className="text-lg font-bold mb-2 text-heading">
            Error Loading Article
          </h3>
          <p className="text-sm text-muted mb-6">{error}</p>
          <button
            onClick={() => router.push("/articles")}
            className="px-6 py-2 bg-btn-primary text-on-primary rounded-full font-semibold cursor-pointer"
          >
            Back to Articles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border-subtle">
        <div className="max-w-[680px] mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-heading transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <span className="text-xs font-semibold text-muted uppercase tracking-widest">Editing Article</span>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-[680px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <BlogForm editBlogId={blogId} initialData={initialData} />
      </div>
    </div>
  );
}
