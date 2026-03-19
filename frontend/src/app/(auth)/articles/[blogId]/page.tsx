"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useUserData } from "@/hooks/useUserData";
import { getBlogByIdController } from "@/controllers/blog/getBlogByIdController";
import { deleteBlogController } from "@/controllers/blog/deleteBlogController";
import { BlogDetailResponse } from "@/lib/types/blogDetail";
import { ArrowLeft, Trash2, Clock, MapPin, Eye, Loader2, X, User } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BlogActions } from "@/components/articles/BlogActions";
import { BlogCommentSection } from "@/components/articles/BlogCommentSection";
import { BlogSaveButton } from "@/components/articles/BlogSaveButton";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accessToken = useAccessToken();
  const currentUser = useUserData();
  const blogId = parseInt(params.blogId as string);

  const [blog, setBlog] = useState<BlogDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBlog = useCallback(async () => {
    if (!accessToken || isNaN(blogId)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getBlogByIdController(accessToken, blogId);
      if (res.success && res.data) {
        setBlog(res.data);
      } else {
        setError(res.message || "Failed to load article.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, blogId]);

  useEffect(() => {
    if (blogId > 0) fetchBlog();
  }, [blogId, fetchBlog]);

  const handleDelete = async () => {
    if (!accessToken) return;
    setIsDeleting(true);
    try {
      const res = await deleteBlogController(accessToken, blogId);
      if (res.success) {
        router.push("/articles");
      } else {
        setError(res.message || "Failed to delete article.");
      }
    } catch {
      setError("Failed to delete article.");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (isNaN(blogId) || blogId <= 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invalid Article ID</h1>
          <button onClick={() => router.push("/articles")} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Back to Articles
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-neutral-900 rounded-xl shadow-xl max-w-lg">
          <X className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Error Loading Article</h3>
          <p className="text-gray-600 dark:text-neutral-400 mb-6">{error}</p>
          <button onClick={fetchBlog} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const canDelete = currentUser?.userId === blog.author.userId || currentUser?.role === "ADMIN";

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <div className="flex items-center gap-3">
              <BlogSaveButton blogId={blogId} />
              {canDelete && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="py-8 px-4">
          <article className="max-w-4xl mx-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            {/* Cover Image */}
            {blog.media.length > 0 && (
              <div className="relative w-full h-80 bg-black">
                <Image src={blog.media[0].mediaUrl} alt={blog.title} fill className="object-cover" priority />
              </div>
            )}

            <div className="p-6 sm:p-10 space-y-8">
              {/* Title & Meta */}
              <header className="space-y-4 pb-4 border-b border-gray-200 dark:border-neutral-800">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <span className={`text-sm font-bold tracking-wider px-3 py-1 rounded-full ${
                    blog.blogStatus === "PUBLISHED"
                      ? "bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                      : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                  }`}>
                    {blog.blogStatus}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-neutral-400">
                    {blog.readTimeMinutes} min read &middot; {blog.wordCount} words
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  {blog.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}</span>
                  </div>
                  {blog.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span>{blog.location.name}</span>
                    </div>
                  )}
                </div>
              </header>

              {/* Author */}
              <section className="flex items-center space-x-3 pb-6 border-b border-gray-100 dark:border-neutral-800">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-neutral-700">
                  <Image
                    src={blog.author.profilePictureUrl}
                    alt={blog.author.username}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="text-sm">
                  <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                    <User className="w-4 h-4 text-indigo-500" />
                    {blog.author.username}
                  </p>
                  <p className="text-gray-500 dark:text-neutral-500">Author</p>
                </div>
              </section>

              {/* Summary */}
              {blog.summary && (
                <section className="bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-4 border-l-4 border-indigo-500 italic text-gray-700 dark:text-neutral-300">
                  {blog.summary}
                </section>
              )}

              {/* Body */}
              <section>
                <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-neutral-300 leading-relaxed text-lg">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{blog.body}</ReactMarkdown>
                </div>
              </section>

              {/* Categories */}
              {blog.categories.length > 0 && (
                <section className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-neutral-800">
                  {blog.categories.map((cat) => (
                    <span
                      key={cat.categoryId}
                      className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                    >
                      {cat.name}
                    </span>
                  ))}
                </section>
              )}

              {/* Reactions */}
              <footer className="pt-6 border-t border-gray-200 dark:border-neutral-800">
                <BlogActions blogId={blogId} />
              </footer>

              {/* Comments */}
              <section className="pt-6 border-t border-gray-200 dark:border-neutral-800">
                <BlogCommentSection blogId={blogId} />
              </section>
            </div>
          </article>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        isDeleting={isDeleting}
      />
    </>
  );
}
