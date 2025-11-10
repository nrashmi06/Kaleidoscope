"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  getPostByIdController,
  isPostError,
  getPostErrorMessage,
  isPostNotFound,
  isAuthError,
} from "@/controllers/post/postController";
import { MappedSinglePost } from "@/lib/mappers/postMapper";
import { TagList } from "@/components/tag/TagList";
import {
  Clock,
  Eye,
  Lock,
  Globe,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { PostActions } from "@/components/feed/socialMediaPostCardComponents/PostActions";
import CommentDropdown from "@/components/feed/socialMediaPostCardComponents/CommentDropdown";

interface PostDetailsProps {
  postId: number;
  accessToken?: string;
  currentUserId?: number;
  onPostNotFound?: () => void;
  onAuthError?: () => void;
}

/**
 * Simplified, modern UI for Post Details
 */
export function PostDetails({
  postId,
  accessToken,
  currentUserId,
  onPostNotFound,
  onAuthError,
}: PostDetailsProps) {
  const [post, setPost] = useState<MappedSinglePost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getPostByIdController(postId, accessToken);
      if (isPostError(result)) {
        const msg = getPostErrorMessage(result);
        setError(msg);
        if (isPostNotFound(result)) onPostNotFound?.();
        else if (isAuthError(result)) onAuthError?.();
      } else setPost(result.data || null);
    } catch (err) {
      setError("An unexpected error occurred.");
      console.error("[PostDetails] Error fetching post:", err);
    } finally {
      setLoading(false);
    }
  }, [postId, accessToken, onPostNotFound, onAuthError]);

  useEffect(() => {
    if (postId) fetchPost();
  }, [postId, fetchPost]);

  const openImage = (i: number) => {
    setSelectedImageIndex(i);
    document.body.style.overflow = "hidden";
  };
  const closeImage = () => {
    setSelectedImageIndex(null);
    document.body.style.overflow = "unset";
  };

  // ⏳ Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-neutral-950 dark:to-blue-950/30">
        <div className="animate-pulse text-gray-500 dark:text-neutral-400">
          Loading post...
        </div>
      </div>
    );
  }

  // ❌ Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <div className="bg-white dark:bg-neutral-900 shadow-xl rounded-xl p-10 border border-red-200 dark:border-red-900/40">
          <X className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Failed to load post
          </h2>
          <p className="text-gray-600 dark:text-neutral-400 mb-6">{error}</p>
          <button
            onClick={fetchPost}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // 🈳 Empty state
  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-600 dark:text-neutral-400">
          No post found.
        </div>
      </div>
    );
  }

  const media = post.media;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-neutral-950 dark:to-blue-950/30 py-8 px-4">
        <article className="max-w-5xl mx-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-xl overflow-hidden border border-blue-200 dark:border-blue-900/40">
          {/* Header */}
          <header className="p-6 flex items-start gap-3 border-b border-blue-100 dark:border-blue-900/40">
            <Image
              src={post.author.profilePictureUrl}
              alt="Author"
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-900 dark:text-white">
                {post.author.username}
              </div>
              <div className="text-xs text-gray-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                <Clock className="w-3 h-3" />
                {post.formattedCreatedAt}
                {post.visibility === "PUBLIC" ? (
                  <Globe className="w-3 h-3 text-blue-500" />
                ) : (
                  <Lock className="w-3 h-3 text-amber-500" />
                )}
              </div>
            </div>
          </header>

          {/* Media */}
          {media.length > 0 && (
            <div className="relative w-full bg-black">
              {media.length === 1 ? (
                <Image
                  src={media[0].mediaUrl}
                  alt="Post media"
                  width={1280}
                  height={720}
                  className="object-contain w-full cursor-pointer"
                  onClick={() => openImage(0)}
                />
              ) : (
                <div className="grid grid-cols-2 gap-1 p-1">
                  {media.slice(0, 4).map((m, i) => (
                    <div
                      key={m.mediaId}
                      className="relative cursor-pointer"
                      onClick={() => openImage(i)}
                    >
                      <Image
                        src={m.mediaUrl}
                        alt={`Media ${i}`}
                        width={640}
                        height={480}
                        className="object-cover w-full h-full rounded-md hover:opacity-90 transition"
                      />
                      {media.length > 4 && i === 3 && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-2xl font-bold">
                          +{media.length - 4}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {post.title}
            </h1>
            <p className="text-gray-700 dark:text-neutral-300 whitespace-pre-wrap">
              {post.body}
            </p>

            {/* Metadata */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-blue-100 dark:border-blue-900/30 text-sm text-gray-600 dark:text-neutral-400">
              <Eye className="w-4 h-4 text-blue-500" />
              {post.viewCount.toLocaleString()} views
            </div>

            <PostActions postId={post.postId} />

            <TagList
              contentType="POST"
              contentId={post.postId}
              accessToken={accessToken}
              currentUserId={currentUserId}
              pageSize={5}
              showPagination
              onAuthError={onAuthError}
            />

            <CommentDropdown postId={post.postId} />
          </div>
        </article>
      </div>

      {/* Fullscreen Image Viewer */}
      {selectedImageIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeImage}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeImage();
            }}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="relative w-full max-w-6xl h-[80vh]">
            <Image
              src={media[selectedImageIndex].mediaUrl}
              alt={`Full image ${selectedImageIndex + 1}`}
              fill
              className="object-contain"
            />
          </div>

          {media.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(
                    (selectedImageIndex - 1 + media.length) % media.length
                  );
                }}
                className="absolute left-6 bg-white/20 hover:bg-white/30 p-3 rounded-full"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(
                    (selectedImageIndex + 1) % media.length
                  );
                }}
                className="absolute right-6 bg-white/20 hover:bg-white/30 p-3 rounded-full"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
