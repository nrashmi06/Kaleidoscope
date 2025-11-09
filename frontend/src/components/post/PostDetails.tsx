"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  getPostByIdController, 
  isPostError, 
  getPostErrorMessage, 
  isNetworkError,
  isPostNotFound,
  isAuthError 
} from "@/controllers/post/postController";
import { MappedSinglePost } from "@/lib/mappers/postMapper";
import { TagList } from "@/components/tag/TagList";
import { Clock, MapPin, Heart, MessageCircle, Eye, Hash, Users, RefreshCw } from "lucide-react";

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
  const [post, setPost] = useState<MappedSinglePost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  const fetchPost = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getPostByIdController(postId, accessToken);

      if (isPostError(result)) {
        const errorMessage = getPostErrorMessage(result);
        setError(errorMessage);

        // Handle specific error types
        if (isPostNotFound(result)) {
          onPostNotFound?.();
        } else if (isAuthError(result)) {
          onAuthError?.();
        }
      } else {
        setPost(result.data || null);
        setRetryCount(0); // Reset retry count on success
      }
    } catch (err) {
      console.error('Unexpected error in PostDetails:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId > 0) {
      fetchPost();
    }
  }, [postId, accessToken]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchPost();
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 animate-pulse">
          {/* Header skeleton */}
          <div className="p-6 border-b border-gray-200 dark:border-neutral-800">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-300 dark:bg-neutral-700 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-neutral-700 rounded w-32"></div>
                <div className="h-3 bg-gray-300 dark:bg-neutral-700 rounded w-24"></div>
              </div>
            </div>
          </div>
          
          {/* Content skeleton */}
          <div className="p-6 space-y-4">
            <div className="h-8 bg-gray-300 dark:bg-neutral-700 rounded w-3/4"></div>
            <div className="h-64 bg-gray-300 dark:bg-neutral-700 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-neutral-700 rounded"></div>
              <div className="h-4 bg-gray-300 dark:bg-neutral-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-red-200 dark:border-red-800">
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-red-500">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Failed to Load Post
            </h3>
            <p className="text-gray-600 dark:text-neutral-400 mb-6">
              {error}
            </p>
            <div className="space-x-4">
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Try Again
              </button>
              <button
                onClick={() => router.back()}
                className="inline-flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No post data
  if (!post) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800">
          <div className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Post Not Found
            </h3>
            <p className="text-gray-600 dark:text-neutral-400">
              The requested post could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state - render post
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <article className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 overflow-hidden">
        {/* Header */}
        <header className="p-6 border-b border-gray-200 dark:border-neutral-800">
          <div className="flex items-center space-x-4">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-neutral-700">
              <Image
                src={post.author.profilePictureUrl}
                alt={`${post.author.username}'s profile picture`}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/default-avatar.png';
                }}
              />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {post.author.username}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-neutral-400">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {post.formattedCreatedAt}
                </span>
                {post.location && (
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {post.location.name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                post.status === 'PUBLISHED' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {post.status.toLowerCase()}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                post.visibility === 'PUBLIC' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
              }`}>
                {post.visibility.toLowerCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {post.title}
          </h1>

          {/* Media */}
          {post.media.length > 0 && (
            <div className="space-y-4">
              {post.media.map((media, index) => (
                <div key={media.mediaId} className="relative rounded-lg overflow-hidden">
                  <Image
                    src={media.mediaUrl}
                    alt={`Post media ${index + 1}`}
                    width={media.width}
                    height={media.height}
                    className="w-full h-auto"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Body */}
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {post.body}
            </p>
          </div>

          {/* Categories */}
          {post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.categories.map((category) => (
                <span
                  key={category.categoryId}
                  className="px-3 py-1 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 rounded-full text-sm font-medium"
                >
                  {category.name}
                </span>
              ))}
            </div>
          )}

          {/* Hashtags */}
          {post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.hashtags.map((hashtag, index) => (
                <span
                  key={index}
                  className="flex items-center text-blue-600 dark:text-blue-400 font-medium text-sm"
                >
                  <Hash className="w-3 h-3 mr-1" />
                  {hashtag.replace('#', '')}
                </span>
              ))}
            </div>
          )}

          {/* Tagged Users - Enhanced with Pagination */}
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

        {/* Footer with engagement stats */}
        <footer className="p-6 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <span className="flex items-center text-gray-600 dark:text-neutral-400">
                <Heart className={`w-5 h-5 mr-2 ${post.currentUserReaction === 'LIKE' ? 'fill-red-500 text-red-500' : ''}`} />
                {post.reactionCount} likes
              </span>
              <span className="flex items-center text-gray-600 dark:text-neutral-400">
                <MessageCircle className="w-5 h-5 mr-2" />
                {post.commentCount} comments
              </span>
              <span className="flex items-center text-gray-600 dark:text-neutral-400">
                <Eye className="w-5 h-5 mr-2" />
                {post.viewCount} views
              </span>
            </div>
            
            {post.updatedAt.getTime() !== post.createdAt.getTime() && (
              <span className="text-sm text-gray-500 dark:text-neutral-500">
                Updated {post.formattedUpdatedAt}
              </span>
            )}
          </div>
        </footer>
      </article>
    </div>
  );
}
