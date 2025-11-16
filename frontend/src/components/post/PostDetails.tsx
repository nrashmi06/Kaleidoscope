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
  Image as ImageIcon
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

// 2. DELETE the broken formatRelativeTime function
// const formatRelativeTime = (date: Date): string => { ... };

/**
 * A Next.js component to display detailed information for a single post,
 * redesigned with a modern, centered, magazine-style card layout.
 */
export function PostDetails({ 
  postId, 
  accessToken, 
  currentUserId,
  onPostNotFound, 
  onAuthError 
}: PostDetailsProps) {
  const [post, setPost] = useState<MappedSinglePost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setRetryCount] = useState(0);

  // Time state for live relative updates
  const [timeSinceCreation, setTimeSinceCreation] = useState<string>('');
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('');

  // Image viewer state
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [loadedMediaIds, setLoadedMediaIds] = useState<Set<number>>(new Set());

  // --- Data Fetching Logic (unchanged) ---
  const fetchPost = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadedMediaIds(new Set());

    try {
      const result = await getPostByIdController(postId, accessToken);
      if (isPostError(result)) {
        const errorMessage = getPostErrorMessage(result);
        setError(errorMessage);
        if (isPostNotFound(result)) {
          onPostNotFound?.();
        } else if (isAuthError(result)) {
          onAuthError?.();
        }
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
    if (postId > 0) {
      fetchPost();
    }
  }, [postId, accessToken, fetchPost]);
  
  // --- LIVE TIME UPDATE EFFECT (FIXED) ---
  useEffect(() => {
    if (!post) return;

    const updateTimes = () => {
        // 3. USE the correct date-fns function
        setTimeSinceCreation(formatDistanceToNow(post.createdAt, { addSuffix: true }));
        setTimeSinceUpdate(formatDistanceToNow(post.updatedAt, { addSuffix: true }));
    };

    updateTimes(); // Initial calculation

    // Update the time every 30 seconds
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

  // --- Image Viewer Logic (unchanged) ---
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
    if (direction === 'next') {
      setSelectedImageIndex((selectedImageIndex + 1) % mediaCount);
    } else {
      setSelectedImageIndex((selectedImageIndex - 1 + mediaCount) % mediaCount);
    }
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
  
  // --- Markdown & Hashtag Handling (unchanged logic) ---
  const router = useRouter();

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
          className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 focus:outline-none transition-colors"
        >
          {children}
        </button>
      );
    }

    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        {...props}
        className="text-indigo-600 dark:text-indigo-400 hover:underline transition-colors"
      >
        {children}
      </a>
    );
  };

  // --- Loading State (Unchanged) ---
  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4 bg-gray-50 dark:bg-neutral-950">
        <div className="w-full mx-auto max-w-4xl animate-pulse">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl overflow-hidden">
            {/* Media Skeleton */}
            <div className="w-full h-80 bg-gray-200 dark:bg-neutral-800 flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-300 dark:text-neutral-700" />
            </div>
            
            <div className="p-6 sm:p-10 space-y-6">
              {/* Header/Metadata Skeleton */}
              <div className="space-y-2 pb-4 border-b border-gray-100 dark:border-neutral-800">
                <div className="h-4 w-1/4 bg-gray-300 dark:bg-neutral-700 rounded-full"></div>
                <div className="h-10 w-3/4 bg-gray-400 dark:bg-neutral-700 rounded"></div>
              </div>
              
              {/* Author/Date Skeleton */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-neutral-700"></div>
                <div className="flex-1 space-y-1">
                    <div className="h-4 w-20 bg-gray-300 dark:bg-neutral-700 rounded"></div>
                    <div className="h-3 w-32 bg-gray-200 dark:bg-neutral-800 rounded"></div>
                </div>
              </div>

              {/* Body Skeleton */}
              <div className="space-y-3 pt-4">
                <div className="h-4 w-full bg-gray-200 dark:bg-neutral-800 rounded"></div>
                <div className="h-4 w-11/12 bg-gray-200 dark:bg-neutral-800 rounded"></div>
                <div className="h-4 w-full bg-gray-200 dark:bg-neutral-800 rounded"></div>
                <div className="h-4 w-5/6 bg-gray-200 dark:bg-neutral-800 rounded"></div>
              </div>
              
              {/* Tags/Actions Skeleton */}
              <div className="h-10 w-full bg-gray-100 dark:bg-neutral-800 rounded-lg mt-6"></div>
              <div className="h-24 w-full bg-gray-100 dark:bg-neutral-800 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Error State (Unchanged) ---
  if (error) {
    return (
      <div className="min-h-screen py-8 px-4 flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <div className="w-full max-w-lg">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl border-2 border-red-500/20 dark:border-red-500/30 overflow-hidden p-12 text-center">
            <X className="w-10 h-10 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Post</h3>
            <p className="text-gray-600 dark:text-neutral-400 mb-6">{error}</p>
            <button
              onClick={handleRetry}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  // --- Success State (Magazine Layout) ---
  const mediaCount = post.media.length;
  const hasMedia = mediaCount > 0;
  const linkedBody = linkifyHashtags(post.body);

  return (
    <>
      <div className="min-h-screen py-8 px-4 bg-gray-50 dark:bg-neutral-950">
        <div className="w-full mx-auto max-w-4xl">
          
          <article className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            
            {/* --- 1. Top Media Banner / Gallery Preview --- */}
            {hasMedia && (
              <div className="relative w-full h-80 bg-black flex items-center justify-center overflow-hidden">
                
                {/* Always use the first image as the cover/preview */}
                <div 
                  className="relative w-full h-full cursor-pointer"
                  onClick={() => openImageViewer(0)}
                >
                  {/* Image loading indicator */}
                  {!loadedMediaIds.has(post.media[0].mediaId) && (
                    <div className="absolute inset-0 bg-gray-200 dark:bg-neutral-800 animate-pulse"></div>
                  )}
                  
                  {/* Image component for the preview */}
                  <Image
                    src={post.media[0].mediaUrl}
                    alt="Post media banner preview"
                    fill
                    sizes="100vw"
                    className={`object-cover transition-opacity duration-500 ${loadedMediaIds.has(post.media[0].mediaId) ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => handleImageLoad(post.media[0].mediaId)}
                    priority
                  />
                  
                  {/* Overlay for interaction and gallery count */}
                  <div className="absolute inset-0 bg-black/30 hover:bg-black/10 transition-colors flex items-center justify-center">
                    
                    {/* Gallery Count Overlay for multiple images */}
                    {mediaCount > 1 && (
                        <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                           <ImageIcon className="w-4 h-4" />
                           {mediaCount} Photos
                        </div>
                    )}
                    
                    {/* Eye icon to indicate click opens viewer */}
                    <Eye className="w-8 h-8 text-white opacity-70 hover:opacity-100 transition" />
                  </div>
                </div>
              </div>
            )}

            {/* --- 2. Main Content and Metadata --- */}
            <div className="p-6 sm:p-10 space-y-8">
              
              {/* --- Title & Status Header --- */}
              <header className="space-y-4 pb-4 border-b border-gray-200 dark:border-neutral-800">
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className={`text-sm font-bold tracking-wider px-3 py-1 rounded-full ${
                        post.status === 'PUBLISHED' 
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                          : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                    }`}>
                      {post.status.toUpperCase()}
                    </span>
                    {post.categories.length > 0 && (
                        <span className="text-xs text-gray-500 dark:text-neutral-500 flex items-center gap-1">
                            Category: <span className="font-semibold text-gray-700 dark:text-neutral-300">{post.categories[0].name}</span>
                        </span>
                    )}
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  {post.title}
                </h1>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-neutral-400">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400 dark:text-neutral-600" />
                        {/* 4. USE THE STATE VARIABLE */}
                        <span>Posted {timeSinceCreation}</span>
                    </div>
                    {post.location && (
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-red-500" />
                            <span>{post.location.name}</span>
                        </div>
                    )}
                </div>
              </header>

              {/* --- Author & Initial Body (Article Metadata) --- */}
              <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-neutral-800">
                <div className="flex items-center space-x-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-neutral-700 flex-shrink-0">
                    <Image
                      src={post.author.profilePictureUrl}
                      alt={`${post.author.username}'s profile picture`}
                      fill
                      className="object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }}
                    />
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                      <User className="w-4 h-4 text-indigo-500" />
                      {post.author.username}
                    </p>
                    <p className="text-gray-500 dark:text-neutral-500">Author</p>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-neutral-400">
                    {post.updatedAt.getTime() !== post.createdAt.getTime() && (
                      <span className="text-xs text-gray-500 dark:text-neutral-500 italic">
                        {/* 5. USE THE STATE VARIABLE */}
                        (Edited: {timeSinceUpdate})
                      </span>
                    )}
                </div>
              </section>

              {/* --- Main Post Body (Markdown) --- */}
              <section>
                <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-neutral-300 leading-relaxed text-lg">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: MarkdownLink,
                      // Improved markdown rendering styles
                      strong: ({ children }) => <strong className="font-extrabold text-gray-900 dark:text-white">{children}</strong>,
                      em: ({ children }) => <em className="italic text-gray-800 dark:text-neutral-200">{children}</em>,
                      h1: ({ children }) => <h1 className="text-3xl font-extrabold my-6 border-b border-indigo-200 dark:border-neutral-700 pb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-2xl font-bold my-5 pt-3 text-indigo-600 dark:text-indigo-400">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xl font-semibold my-4">{children}</h3>,
                      ul: ({ children }) => <ul className="list-disc list-outside pl-6 my-4 space-y-3">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-outside pl-6 my-4 space-y-3">{children}</ol>,
                      li: ({ children }) => <li className="pl-1 text-base">{children}</li>,
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-indigo-500 pl-4 py-2 my-4 bg-indigo-50/50 dark:bg-neutral-800/50 italic">{children}</blockquote>,
                      code: ({ children }) => <code className="bg-indigo-50 dark:bg-neutral-800 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-md font-mono text-sm">{children}</code>,
                      p: ({ children }) => <p className="my-5">{children}</p>
                    }}
                  >
                    {linkedBody}
                  </ReactMarkdown>
                </div>
              </section>

              {/* --- Footer: Actions, Tags & View Count --- */}
              <footer className="space-y-6 pt-6 border-t border-gray-200 dark:border-neutral-800">
                
                {/* Hashtag Badges Section */}
                {post.hashtags.length > 0 && (
                  <div>
                      <h4 className="text-base font-bold text-gray-600 dark:text-neutral-300 mb-3 flex items-center gap-2"><Hash className="w-5 h-5 text-indigo-500" /> Related Topics</h4>
                      <div className="flex flex-wrap gap-3">
                          {post.hashtags.map((hashtag, index) => (
                            <button
                              key={index}
                              onClick={() => handleHashtagClick(hashtag)}
                              className="
                                flex items-center gap-1 px-4 py-1.5 
                                rounded-full text-sm font-medium
                                bg-indigo-50 dark:bg-indigo-900/30
                                text-indigo-700 dark:text-indigo-400 
                                transition-all duration-200 
                                hover:bg-indigo-100 dark:hover:bg-indigo-800/50 shadow-md
                              "
                            >
                              {hashtag.replace('#', '')}
                            </button>
                          ))}
                      </div>
                  </div>
                )}
                
                {/* Post Actions & Views */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-neutral-800">
                    <PostActions postId={post.postId} />
                    <span className="flex items-center gap-1.5 text-base font-semibold text-gray-700 dark:text-neutral-300">
                       <Eye className="w-5 h-5 text-indigo-500" />
                       {post.viewCount.toLocaleString()} Views
                    </span>
                </div>

              </footer>

              {/* --- Comments Section --- */}
              <section className="pt-6 border-t border-gray-200 dark:border-neutral-800">
                <CommentDropdown postId={post.postId} />
              </section>

              {/* --- User Tags (Moved to the end) --- */}
              <section className="pt-6 border-t border-gray-200 dark:border-neutral-800">
                  <h4 className="text-base font-bold text-gray-600 dark:text-neutral-300 mb-3 flex items-center gap-2"><User className="w-5 h-5 text-indigo-500" /> Tagged Users</h4>
                <TagList 
                  contentType="POST"
                  contentId={post.postId}
                  accessToken={accessToken}
                  currentUserId={currentUserId}
                  pageSize={5}
                  showPagination={true}
                  onAuthError={onAuthError}
                />
              </section>

            </div>
          </article>
        </div>
      </div>

      {/* --- Full-Screen Image Viewer Modal (Unchanged) --- */}
      {selectedImageIndex !== null && post.media[selectedImageIndex] && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 transition-opacity duration-300"
          onClick={closeImageViewer}
        >
          <button
            onClick={(e) => { e.stopPropagation(); closeImageViewer(); }}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/30 rounded-full transition-colors z-10 shadow-lg"
            aria-label="Close image viewer"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          {post.media.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigateImage('prev'); }}
                className="absolute left-4 p-4 bg-white/10 hover:bg-white/30 rounded-full transition-colors z-10 disabled:opacity-50"
                aria-label="Previous image"
                disabled={selectedImageIndex === 0}
              >
                <ChevronLeft className="w-6 h-6 text-white" strokeWidth={3} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigateImage('next'); }}
                className="absolute right-4 p-4 bg-white/10 hover:bg-white/30 rounded-full transition-colors z-10 disabled:opacity-50"
                aria-label="Next image"
                disabled={selectedImageIndex === post.media.length - 1}
              >
                <ChevronRight className="w-6 h-6 text-white" strokeWidth={3} />
              </button>
            </>
          )}
          {post.media.length > 1 && (
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white/10 text-white px-4 py-1.5 rounded-full font-semibold text-sm z-10">
              {selectedImageIndex + 1} of {post.media.length}
            </div>
          )}
          <div 
            className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full">
              <Image
                src={post.media[selectedImageIndex].mediaUrl}
                alt={`Full size image ${selectedImageIndex + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.png'; }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}