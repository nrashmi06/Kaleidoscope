"use client";

// [FIX] Import ComponentPropsWithoutRef to correctly type the link component
import { useState, useEffect, useCallback, type ComponentPropsWithoutRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown"; // <-- Renders Markdown
import remarkGfm from "remark-gfm"; // <-- Adds GitHub-flavored markdown (tables, etc.)
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
  Globe, 
  Lock, 
  Sparkles, 
  X, 
  ChevronLeft, 
  ChevronRight
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
 * A Next.js component to display detailed information for a single post,
 * redesigned with a modern, sleek, and responsive layout.
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

  // Image viewer state
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [loadedMediaIds, setLoadedMediaIds] = useState<Set<number>>(new Set());

  // --- Data Fetching Logic ---
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

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchPost();
  };

  const handleImageLoad = useCallback((mediaId: number) => {
    setLoadedMediaIds(prev => new Set(prev).add(mediaId));
  }, []);

  // --- Image Viewer Logic ---
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
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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
  
  // --- UI Helper (Media Grid) ---
  const getMediaGridClasses = (count: number) => {
    if (count === 1) return "grid-cols-1 grid-rows-1";
    if (count === 2) return "grid-cols-1 grid-rows-2";
    if (count === 3) return "grid-cols-2 grid-rows-2"; // 1 big, 2 small
    if (count === 4) return "grid-cols-2 grid-rows-2";
    return "grid-cols-2 grid-rows-2"; // Default for 5+
  };

  // --- [MODIFIED] Markdown & Hashtag Handling ---
  const router = useRouter();

  const linkifyHashtags = (text: string) => {
    const hashtagRegex = /(?<!\w)(#\w+)(?!\w)/g;
    return text.replace(hashtagRegex, (match) => `[${match}](${match})`);
  };

  const handleHashtagClick = (tag: string) => {
    const normalizedTag = tag.replace('#', '');
    router.push(`/feed?search=${normalizedTag}`);
  };

  /**
   * [FIX for TS(2322)]
   * This component now correctly accepts all props for an <a> tag
   * by using ComponentPropsWithoutRef and spreading {...props}.
   */
  const MarkdownLink = ({ href, children, ...props }: ComponentPropsWithoutRef<"a">) => {
    if (href && href.startsWith('#')) {
      // It's a hashtag link
      return (
        <button
          onClick={() => handleHashtagClick(href)}
          className="text-blue-600 dark:text-blue-400 font-medium hover:underline focus:outline-none"
        >
          {children}
        </button>
      );
    }

    // It's a regular external link
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        {...props} // Pass down all other props (like className, etc.)
        className="text-blue-600 dark:text-blue-400 hover:underline" // Apply default link styling
      >
        {children}
      </a>
    );
  };
  // --- [END MODIFIED LOGIC] ---


  // --- Loading State ---
  if (loading) {
    const hasMediaSkeleton = true; // Default to showing media skeleton
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 py-8 px-4">
        <div className={`w-full mx-auto ${hasMediaSkeleton ? 'max-w-6xl h-[90vh]' : 'max-w-3xl'} animate-pulse`}>
          <div className={`grid ${hasMediaSkeleton ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden ${hasMediaSkeleton ? 'h-full' : ''}`}>
            {/* Left Column Skeleton */}
            {hasMediaSkeleton && (
              <div className="w-full h-[60vh] lg:h-full bg-gray-200 dark:bg-neutral-800"></div>
            )}
            
            {/* Right Column Skeleton */}
            <div className="flex flex-col w-full h-full overflow-y-auto hide-scrollbar">
              <header className="p-4 flex items-start space-x-4 border-b border-gray-100 dark:border-neutral-800">
                <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-neutral-700"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-300 dark:bg-neutral-700 rounded"></div>
                  <div className="h-3 w-24 bg-gray-300 dark:bg-neutral-700 rounded"></div>
                </div>
              </header>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <div className="h-6 w-3/4 bg-gray-300 dark:bg-neutral-700 rounded"></div>
                  <div className="h-4 w-full bg-gray-200 dark:bg-neutral-700 rounded"></div>
                  <div className="h-4 w-5/6 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                </div>
                <div className="h-10 w-full bg-gray-200 dark:bg-neutral-700 rounded-lg"></div>
                <div className="h-24 w-full bg-gray-200 dark:bg-neutral-700 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 py-8 px-4 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-red-200 dark:border-red-900/50 overflow-hidden p-12 text-center">
            <X className="w-10 h-10 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Post</h3>
            <p className="text-gray-600 dark:text-neutral-400 mb-6">{error}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- No Post Data State ---
  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 py-8 px-4 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl p-12 text-center">
            <Eye className="w-10 h-10 mx-auto mb-4 text-gray-500 dark:text-neutral-500" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Post Not Found</h3>
            <p className="text-gray-600 dark:text-neutral-400">The requested post could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  // --- [REDESIGNED] Success State ---
  const mediaCount = post.media.length;
  const hasMedia = mediaCount > 0;
  
  // Pre-process the post body once
  const linkedBody = linkifyHashtags(post.body);

  return (
    <>
      {/* Parent Wrapper: Sets max-width based on media presence */}
      <div className={`min-h-screen bg-gray-50 dark:bg-neutral-950 py-8 px-4 ${hasMedia ? 'lg:py-12' : ''}`}>
        <div className={`w-full mx-auto ${hasMedia ? 'max-w-7xl' : 'max-w-3xl'}`}>
          {/* Main Article Container - Two-Column or Single-Column Layout */}
          <article className={`grid ${hasMedia ? 'grid-cols-1 lg:grid-cols-2 lg:h-[90vh]' : 'grid-cols-1'} bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden`}>
            
            {/* --- 1. Left Column: Media (CONDITIONAL) --- */}
            {hasMedia && (
              <div className="relative w-full h-[60vh] lg:h-full bg-black flex items-center justify-center overflow-auto hide-scrollbar">
                {mediaCount === 1 && (
                  <div 
                    className="relative w-full h-full cursor-pointer group"
                    onClick={() => openImageViewer(0)}
                  >
                    {!loadedMediaIds.has(post.media[0].mediaId) && (
                      <div className="absolute inset-0 bg-gray-200 dark:bg-neutral-800 animate-pulse"></div>
                    )}
                    <Image
                      src={post.media[0].mediaUrl}
                      alt="Post media"
                      fill
                      sizes="(max-width: 1280px) 50vw, 100vw"
                      className={`object-contain transition-opacity duration-300 ${loadedMediaIds.has(post.media[0].mediaId) ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => handleImageLoad(post.media[0].mediaId)}
                      priority
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Eye className="w-10 h-10 text-white drop-shadow-lg" />
                    </div>
                  </div>
                )}

                {mediaCount > 1 && (
                  <div className={`grid ${getMediaGridClasses(mediaCount)} gap-1 w-full h-full`}>
                    {post.media.map((media, index) => {
                      const isLoaded = loadedMediaIds.has(media.mediaId);
                      return (
                        <div
                          key={media.mediaId}
                          className={`relative w-full h-full cursor-pointer group bg-black ${
                            mediaCount === 3 && index === 0 ? "col-span-2 row-span-2" : ""
                          } ${mediaCount >= 5 && index > 2 ? "hidden" : "" }`} // Simple 5+ handling
                          onClick={() => openImageViewer(index)}
                        >
                          {!isLoaded && (
                            <div className="absolute inset-0 bg-gray-200 dark:bg-neutral-800 animate-pulse"></div>
                          )}
                          <Image
                            src={media.mediaUrl}
                            alt={`Post media ${index + 1}`}
                            fill
                            sizes="(max-width: 1280px) 25vw, 50vw"
                            className={`object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => handleImageLoad(media.mediaId)}
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <Eye className="w-8 h-8 text-white" />
                          </div>
                          {mediaCount > 4 && index === 3 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-3xl font-bold">
                              +{mediaCount - 4}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* --- 2. Right Column: Content & Interaction --- */}
            <div className="relative flex flex-col w-full h-full overflow-y-auto hide-scrollbar">
              {/* Header (Author) - Sticky */}
              <header className="sticky top-0 z-10 p-4 flex items-start space-x-4 border-b border-gray-100 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-neutral-700 flex-shrink-0">
                  <Image
                    src={post.author.profilePictureUrl}
                    alt={`${post.author.username}'s profile picture`}
                    fill
                    className="object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-1">
                    {post.author.username}
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-500 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{post.formattedCreatedAt}</span>
                    <span className="text-gray-400 dark:text-neutral-600">•</span>
                    {post.visibility === 'PUBLIC' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    post.status === 'PUBLISHED' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {post.status.toUpperCase()}
                </span>
              </header>

              {/* Scrollable Content Area */}
              <div className="flex-1 p-4 sm:p-6 space-y-6">
                
                {/* --- [MODIFIED] Title & Body Section --- */}
                <section>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                    {post.title}
                  </h1>
                  
                  {/* [FIX] Removed `whitespace-pre-wrap` from this div */}
                  <div className="max-w-none text-gray-700 dark:text-neutral-300 leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]} // gfm plugin will handle newlines -> <br>
                      components={{
                        a: MarkdownLink,
                        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        h1: ({ children }) => <h1 className="text-2xl font-bold my-4">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-bold my-3">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-bold my-2">{children}</h3>,
                        ul: ({ children }) => <ul className="list-disc list-outside pl-5 my-4 space-y-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-outside pl-5 my-4 space-y-2">{children}</ol>,
                        li: ({ children }) => <li className="pl-2">{children}</li>,
                        code: ({ children }) => <code className="bg-gray-100 dark:bg-neutral-800 text-red-500 dark:text-red-400 px-1.5 py-0.5 rounded-md font-mono text-sm">{children}</code>,
                        p: ({ children }) => <p className="my-4">{children}</p> // Ensures paragraphs have margins
                      }}
                    >
                      {linkedBody}
                    </ReactMarkdown>
                  </div>
                </section>
                {/* --- [END MODIFIED SECTION] --- */}


                {/* Metadata (Location, Categories, Hashtags) */}
                <section className="space-y-4 pt-6 border-t border-gray-100 dark:border-neutral-800">
                  {post.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400">
                      <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span>{post.location.name}</span>
                    </div>
                  )}
                  
                  {post.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.categories.map((category) => (
                        <span
                          key={category.categoryId}
                          className="px-3 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-900"
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* --- Hashtag Badges Section --- */}
                  {post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.hashtags.map((hashtag, index) => (
                        <button
                          key={index}
                          onClick={() => handleHashtagClick(hashtag)}
                          className="
                            flex items-center gap-1.5 px-3 py-1.5 
                            rounded-full text-xs font-semibold
                            bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 
                            dark:from-blue-950/70 dark:via-cyan-950/70 dark:to-blue-950/70
                            text-blue-700 dark:text-blue-300 
                            border border-blue-200 dark:border-blue-900
                            transition-all duration-200 
                            hover:shadow-md hover:scale-105 hover:shadow-blue-500/10
                            focus:outline-none focus:ring-2 focus:ring-blue-500
                          "
                        >
                          <Hash className="w-3 h-3 opacity-70" />
                          {hashtag.replace('#', '')}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* --- [END SECTION] --- */}
                </section>

                {/* Actions & Stats */}
                <footer className="space-y-4 pt-6 border-t border-gray-100 dark:border-neutral-800">
                  {/* Interactive Reactions */}
                  <PostActions postId={post.postId} />
                  
                  {/* View Count & Edited Time */}
                  <div className="flex justify-between items-center text-sm text-gray-600 dark:text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      {post.viewCount} Views
                    </span>
                    {post.updatedAt.getTime() !== post.createdAt.getTime() && (
                      <span className="text-xs text-gray-500 dark:text-neutral-500">
                        Edited {post.formattedUpdatedAt}
                      </span>
                    )}
                  </div>
                </footer>

                {/* Tag List (user tags) */}
                <section className="pt-6 border-t border-gray-100 dark:border-neutral-800">
                  <TagList 
                    contentType="POST"
                    contentId={post.postId}
                    accessToken={accessToken}
                    currentUserId={currentUserId}
                    pageSize={5}
                    showPagination={true} // Pagination makes sense in a scrolling column
                    onAuthError={onAuthError}
                  />
                </section>

                {/* Comments */}
                <section className="pt-6 border-t border-gray-100 dark:border-neutral-800">
                  <CommentDropdown postId={post.postId} />
                </section>
              </div>
            </div>
          </article>
        </div>
      </div>

      {/* --- Full-Screen Image Viewer Modal (Unchanged) --- */}
      {selectedImageIndex !== null && post.media[selectedImageIndex] && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300"
          onClick={closeImageViewer}
        >
          {/* (Modal content is unchanged) */}
          <button
            onClick={(e) => { e.stopPropagation(); closeImageViewer(); }}
            className="absolute top-4 right-4 p-3 bg-black/40 hover:bg-black/60 rounded-full transition-colors z-10"
            aria-label="Close image viewer"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          {post.media.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigateImage('prev'); }}
                className="absolute left-4 p-4 bg-black/40 hover:bg-black/60 rounded-full transition-colors z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6 text-white" strokeWidth={3} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigateImage('next'); }}
                className="absolute right-4 p-4 bg-black/40 hover:bg-black/60 rounded-full transition-colors z-10"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6 text-white" strokeWidth={3} />
              </button>
            </>
          )}
          {post.media.length > 1 && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/40 text-white px-4 py-1.5 rounded-full font-semibold text-sm z-10">
              {selectedImageIndex + 1} / {post.media.length}
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