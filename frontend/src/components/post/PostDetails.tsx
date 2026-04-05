"use client";

import { useState, useEffect, useCallback, type ComponentPropsWithoutRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatDistanceToNow } from "date-fns";
import {
  getPostByIdController,
  isPostError,
  getPostErrorMessage,
  isPostNotFound,
  isAuthError
} from "@/controllers/post/postController";
import { MappedSinglePost } from "@/lib/mappers/postMapper";
import { TagList } from "@/components/tag/TagList";
import {
  Clock,
  MapPin,
  Eye,
  Hash,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Image as ImageIcon,
  Bookmark,
} from "lucide-react";
import { PostActions } from "@/components/feed/socialMediaPostCardComponents/PostActions";
import { PostSaveButton } from "@/components/feed/socialMediaPostCardComponents/PostSaveButton";
import CommentDropdown from "@/components/feed/socialMediaPostCardComponents/CommentDropdown";

interface PostDetailsProps {
  postId: number;
  accessToken?: string;
  currentUserId?: number;
  onPostNotFound?: () => void;
  onAuthError?: () => void;
}

export function PostDetails({
  postId,
  accessToken,
  currentUserId,
  onPostNotFound,
  onAuthError
}: PostDetailsProps) {
  const router = useRouter();
  const [post, setPost] = useState<MappedSinglePost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setRetryCount] = useState(0);

  const [timeSinceCreation, setTimeSinceCreation] = useState<string>('');
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('');

  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [loadedMediaIds, setLoadedMediaIds] = useState<Set<number>>(new Set());

  const fetchPost = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadedMediaIds(new Set());

    try {
      const result = await getPostByIdController(postId, accessToken);
      if (isPostError(result)) {
        const errorMessage = getPostErrorMessage(result);
        setError(errorMessage);
        if (isPostNotFound(result)) onPostNotFound?.();
        else if (isAuthError(result)) onAuthError?.();
      } else {
        setPost(result.data || null);
        setRetryCount(0);
      }
    } catch (err) {
      console.error('Unexpected error in PostDetails:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [postId, accessToken, onPostNotFound, onAuthError]);

  useEffect(() => {
    if (postId > 0) fetchPost();
  }, [postId, accessToken, fetchPost]);

  useEffect(() => {
    if (!post) return;
    const updateTimes = () => {
      setTimeSinceCreation(formatDistanceToNow(post.createdAt, { addSuffix: true }));
      setTimeSinceUpdate(formatDistanceToNow(post.updatedAt, { addSuffix: true }));
    };
    updateTimes();
    const intervalId = setInterval(updateTimes, 30000);
    return () => clearInterval(intervalId);
  }, [post]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchPost();
  };

  const handleImageLoad = useCallback((mediaId: number) => {
    setLoadedMediaIds(prev => new Set(prev).add(mediaId));
  }, []);

  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeImageViewer = () => {
    setSelectedImageIndex(null);
    document.body.style.overflow = 'unset';
  };

  const navigateImage = (direction: 'next' | 'prev') => {
    if (!post || selectedImageIndex === null) return;
    const mediaCount = post.media.length;
    if (direction === 'next') setSelectedImageIndex((selectedImageIndex + 1) % mediaCount);
    else setSelectedImageIndex((selectedImageIndex - 1 + mediaCount) % mediaCount);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      if (e.key === 'Escape') closeImageViewer();
      else if (e.key === 'ArrowLeft') navigateImage('prev');
      else if (e.key === 'ArrowRight') navigateImage('next');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, post]);

  const linkifyHashtags = (text: string) => {
    const hashtagRegex = /(?<!\w)(#\w+)(?!\w)/g;
    return text.replace(hashtagRegex, (match) => `[${match}](${match})`);
  };

  const handleHashtagClick = (tag: string) => {
    const normalizedTag = tag.replace('#', '');
    router.push(`/feed?search=${normalizedTag}`);
  };

  const MarkdownLink = ({ href, children, ...props }: ComponentPropsWithoutRef<"a">) => {
    if (href && href.startsWith('#')) {
      return (
        <button
          onClick={() => handleHashtagClick(href)}
          className="text-steel dark:text-sky font-medium hover:text-steel-600 dark:hover:text-sky/80 focus:outline-none transition-colors"
        >
          {children}
        </button>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}
        className="text-steel dark:text-sky hover:underline transition-colors">
        {children}
      </a>
    );
  };

  // --- Loading ---
  if (loading) {
    return (
      <div className="w-full animate-pulse space-y-6">
        <div className="w-full h-[28rem] rounded-2xl bg-cream-300/40 dark:bg-navy-700/40 flex items-center justify-center">
          <ImageIcon className="w-12 h-12 text-steel/20 dark:text-sky/10" />
        </div>
        <div className="max-w-3xl mx-auto space-y-4 px-4">
          <div className="h-5 w-1/3 bg-cream-300/60 dark:bg-navy-600/60 rounded-full" />
          <div className="h-10 w-4/5 bg-cream-300/40 dark:bg-navy-600/40 rounded" />
          <div className="flex items-center gap-3 mt-4">
            <div className="w-11 h-11 rounded-full bg-cream-300/60 dark:bg-navy-600/60" />
            <div className="space-y-1">
              <div className="h-4 w-24 bg-cream-300/60 dark:bg-navy-600/60 rounded" />
              <div className="h-3 w-36 bg-cream-300/40 dark:bg-navy-600/40 rounded" />
            </div>
          </div>
          <div className="space-y-3 mt-6">
            <div className="h-4 w-full bg-cream-300/40 dark:bg-navy-600/40 rounded" />
            <div className="h-4 w-11/12 bg-cream-300/40 dark:bg-navy-600/40 rounded" />
            <div className="h-4 w-full bg-cream-300/40 dark:bg-navy-600/40 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-full max-w-lg text-center p-10 bg-cream-50 dark:bg-navy-700/50 rounded-2xl border border-red-200/60 dark:border-red-900/30">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 mx-auto mb-4">
            <X className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-navy dark:text-cream mb-2">Error Loading Post</h3>
          <p className="text-sm text-steel dark:text-sky/60 mb-6">{error}</p>
          <button onClick={handleRetry}
            className="px-6 py-2 bg-steel text-cream-50 dark:bg-sky dark:text-navy rounded-xl font-semibold cursor-pointer">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const mediaCount = post.media.length;
  const hasMedia = mediaCount > 0;
  const linkedBody = linkifyHashtags(post.body);

  return (
    <>
      <div className="w-full relative">
        {/* ── Hero Media Section ── */}
        <div className="relative w-full overflow-hidden rounded-2xl">
          <div className={`relative w-full ${hasMedia ? 'h-[28rem]' : 'h-48'} overflow-hidden`}>
            {hasMedia ? (
              <>
                {/* Main image */}
                <div className="relative w-full h-full cursor-pointer" onClick={() => openImageViewer(0)}>
                  {!loadedMediaIds.has(post.media[0].mediaId) && (
                    <div className="absolute inset-0 bg-cream-300/40 dark:bg-navy-700/60 animate-pulse" />
                  )}
                  <Image
                    src={post.media[0].mediaUrl}
                    alt="Post media"
                    fill
                    sizes="100vw"
                    className={`object-cover transition-opacity duration-500 ${loadedMediaIds.has(post.media[0].mediaId) ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => handleImageLoad(post.media[0].mediaId)}
                    priority
                  />
                </div>

                {/* Photo count badge */}
                {mediaCount > 1 && (
                  <button
                    onClick={() => openImageViewer(0)}
                    className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-navy/60 backdrop-blur-sm text-cream-50 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer hover:bg-navy/80 transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    {mediaCount} Photos
                  </button>
                )}
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-steel/20 via-sky/10 to-steel/5 dark:from-steel/30 dark:via-sky/15 dark:to-navy" />
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent pointer-events-none" />

            {/* Title + status overlaid at bottom */}
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-16 z-10">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm ${
                    post.status === 'PUBLISHED'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {post.status.toUpperCase()}
                  </span>
                  {post.categories.length > 0 && (
                    <span className="text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full bg-cream-50/10 text-cream-50/80 backdrop-blur-sm">
                      {post.categories[0].name}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-cream-50 leading-tight drop-shadow-lg">
                  {post.title}
                </h1>
              </div>
            </div>
          </div>

          {/* ── Floating Author Card ── */}
          <div className="relative -mt-10 z-20 mx-4 sm:mx-6">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 bg-cream-50/90 dark:bg-navy-700/90 backdrop-blur-md rounded-2xl px-5 py-4 border border-cream-300/40 dark:border-navy-600/40 shadow-lg shadow-navy/[0.06] dark:shadow-black/20">
              <div className="flex items-center gap-3">
                <div
                  onClick={() => router.push(`/profile/${post.author.userId}`)}
                  className="relative w-11 h-11 rounded-full overflow-hidden bg-cream-300 dark:bg-navy-600 flex-shrink-0 ring-2 ring-steel/20 dark:ring-sky/20 cursor-pointer hover:ring-steel/50 dark:hover:ring-sky/40 transition-all"
                >
                  <Image
                    src={post.author.profilePictureUrl}
                    alt={post.author.username}
                    fill
                    className="object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }}
                  />
                </div>
                <div>
                  <p
                    onClick={() => router.push(`/profile/${post.author.userId}`)}
                    className="text-sm font-bold text-navy dark:text-cream cursor-pointer hover:text-steel dark:hover:text-sky transition-colors hover:underline"
                  >
                    {post.author.username}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-steel/60 dark:text-sky/40">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeSinceCreation}
                    </span>
                    {post.updatedAt.getTime() !== post.createdAt.getTime() && (
                      <span className="italic">(edited {timeSinceUpdate})</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {post.location && (
                  <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-steel/60 dark:text-sky/40 mr-2">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>{post.location.name}</span>
                  </div>
                )}
                <span className="flex items-center gap-1 text-[11px] font-semibold text-steel/60 dark:text-sky/40">
                  <Eye className="w-3.5 h-3.5" />
                  {post.viewCount.toLocaleString()}
                </span>
                <PostSaveButton postId={post.postId} />
              </div>
            </div>
          </div>

          {/* ── Thumbnail Strip (multiple images) ── */}
          {mediaCount > 1 && (
            <div className="max-w-3xl mx-auto mt-4 px-4 sm:px-6">
              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                {post.media.map((m, i) => (
                  <button
                    key={m.mediaId}
                    onClick={() => openImageViewer(i)}
                    className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 border-transparent hover:border-steel dark:hover:border-sky transition-all cursor-pointer"
                  >
                    <Image src={m.mediaUrl} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Content Area ── open flowing, no card wrapper */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
          {/* Post Body */}
          <div className="prose dark:prose-invert max-w-none text-navy/80 dark:text-cream/80 leading-relaxed text-[16.5px]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: MarkdownLink,
                strong: ({ children }) => <strong className="font-extrabold text-navy dark:text-cream">{children}</strong>,
                em: ({ children }) => <em className="italic text-navy/70 dark:text-cream/70">{children}</em>,
                h1: ({ children }) => <h1 className="text-3xl font-extrabold my-6 border-b border-cream-300/40 dark:border-navy-600/40 pb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-2xl font-bold my-5 pt-3 text-steel dark:text-sky">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xl font-semibold my-4">{children}</h3>,
                ul: ({ children }) => <ul className="list-disc list-outside pl-6 my-4 space-y-3">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-outside pl-6 my-4 space-y-3">{children}</ol>,
                li: ({ children }) => <li className="pl-1 text-base">{children}</li>,
                blockquote: ({ children }) => <blockquote className="border-l-[3px] border-steel dark:border-sky pl-4 py-2 my-4 bg-steel/[0.04] dark:bg-sky/[0.04] rounded-r-xl italic">{children}</blockquote>,
                code: ({ children }) => <code className="bg-steel/10 dark:bg-sky/10 text-steel dark:text-sky px-1.5 py-0.5 rounded-md font-mono text-sm">{children}</code>,
                p: ({ children }) => <p className="my-5">{children}</p>
              }}
            >
              {linkedBody}
            </ReactMarkdown>
          </div>

          {/* Hashtags */}
          {post.hashtags.length > 0 && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />
              <div>
                <h4 className="text-sm font-bold text-navy/70 dark:text-cream/70 mb-3 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-steel dark:text-sky" /> Related Topics
                </h4>
                <div className="flex flex-wrap gap-2">
                  {post.hashtags.map((hashtag, index) => (
                    <button
                      key={index}
                      onClick={() => handleHashtagClick(hashtag)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-steel/10 dark:bg-sky/10 text-steel dark:text-sky hover:bg-steel/20 dark:hover:bg-sky/20 cursor-pointer transition-all"
                    >
                      {hashtag.replace('#', '')}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />
          <PostActions postId={post.postId} />

          {/* Comments */}
          <div className="h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />
          <CommentDropdown postId={post.postId} />

          {/* Tagged Users */}
          <div className="h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />
          <div>
            <h4 className="text-sm font-bold text-navy/70 dark:text-cream/70 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-steel dark:text-sky" /> Tagged Users
            </h4>
            <TagList
              contentType="POST"
              contentId={post.postId}
              accessToken={accessToken}
              currentUserId={currentUserId}
              pageSize={5}
              showPagination={true}
              onAuthError={onAuthError}
            />
          </div>
        </div>
      </div>

      {/* ── Full-Screen Image Viewer ── */}
      {selectedImageIndex !== null && post.media[selectedImageIndex] && (
        <div
          className="fixed inset-0 z-50 bg-navy/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={closeImageViewer}
        >
          <button
            onClick={(e) => { e.stopPropagation(); closeImageViewer(); }}
            className="absolute top-6 right-6 p-3 bg-cream-50/10 hover:bg-cream-50/30 rounded-full transition-colors z-10"
            aria-label="Close image viewer"
          >
            <X className="w-6 h-6 text-cream-50" />
          </button>
          {post.media.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigateImage('prev'); }}
                className="absolute left-4 p-4 bg-cream-50/10 hover:bg-cream-50/30 rounded-full transition-colors z-10 disabled:opacity-50"
                aria-label="Previous image"
                disabled={selectedImageIndex === 0}
              >
                <ChevronLeft className="w-6 h-6 text-cream-50" strokeWidth={3} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigateImage('next'); }}
                className="absolute right-4 p-4 bg-cream-50/10 hover:bg-cream-50/30 rounded-full transition-colors z-10 disabled:opacity-50"
                aria-label="Next image"
                disabled={selectedImageIndex === post.media.length - 1}
              >
                <ChevronRight className="w-6 h-6 text-cream-50" strokeWidth={3} />
              </button>
            </>
          )}
          {post.media.length > 1 && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-cream-50/10 text-cream-50 px-4 py-1.5 rounded-full font-semibold text-sm z-10">
              {selectedImageIndex + 1} of {post.media.length}
            </div>
          )}
          <div className="relative w-full h-full max-w-7xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full h-full">
              <Image
                src={post.media[selectedImageIndex].mediaUrl}
                alt={`Full size image ${selectedImageIndex + 1}`}
                fill sizes="100vw" className="object-contain" priority
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.png'; }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
