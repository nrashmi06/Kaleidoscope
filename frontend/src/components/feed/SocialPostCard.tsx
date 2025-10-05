"use client";

import { Heart, MessageCircle, Bookmark, MoreHorizontal, Users, MapPin, Trash2 } from "lucide-react";
import { Post } from "@/services/post/fetchPosts";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { deletePostController } from "@/controllers/postController/deletePost";

interface SocialPostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
}

export function SocialPostCard({ post, onPostDeleted }: SocialPostCardProps) {
  const [showTaggedUsers, setShowTaggedUsers] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteMenuRef = useRef<HTMLDivElement>(null);
  
  // For now, assume current user can delete any post (you can add proper auth check later)
  const canDeletePost = true; // Replace with proper auth logic

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deleteMenuRef.current && !deleteMenuRef.current.contains(event.target as Node)) {
        setShowDeleteMenu(false);
      }
    };

    if (showDeleteMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDeleteMenu]);

  const handleDeletePost = async () => {
    if (!canDeletePost || isDeleting) return;
    
    const confirmDelete = window.confirm("Are you sure you want to delete this post? This action cannot be undone.");
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      console.log('🗑️ Deleting post:', post.postId);
      
      // For now, we'll simulate the delete operation
      // You'll need to get the access token from your auth context
      // const result = await deletePostController(accessToken, post.postId.toString(), true);
      
      // Simulating successful deletion
      console.log('✅ Post deleted successfully');
      onPostDeleted?.(post.postId.toString());
      
    } catch (error) {
      console.error('❌ Error deleting post:', error);
      alert('An error occurred while deleting the post.');
    } finally {
      setIsDeleting(false);
      setShowDeleteMenu(false);
    }
  };

  return (
    <div 
      className="w-full max-w-full mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-800 relative"
      onMouseEnter={() => setShowTaggedUsers(true)}
      onMouseLeave={() => setShowTaggedUsers(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
            <img
              src={post.author.profilePictureUrl || "/person.jpg"}
              alt={post.author.username}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold text-base text-gray-900 dark:text-white">
              {post.author.username}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              {post.location && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{post.location.name}, {post.location.city}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="relative" ref={deleteMenuRef}>
          <button 
            onClick={() => setShowDeleteMenu(!showDeleteMenu)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
          
          {/* Delete Menu */}
          {showDeleteMenu && canDeletePost && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg z-10 min-w-[120px]">
              <button
                onClick={handleDeletePost}
                disabled={isDeleting}
                className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Deleting...' : 'Delete Post'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 space-y-4">
        {/* Images - Show ALL images */}
        {post.mediaDetails && post.mediaDetails.length > 0 ? (
          <div className="space-y-2">
            {/* Single image */}
            {post.mediaDetails.length === 1 && (
              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={post.mediaDetails[0].url}
                  alt="Post image"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Multiple images in grid */}
            {post.mediaDetails.length > 1 && (
              <div className={`grid gap-1 rounded-lg overflow-hidden ${
                post.mediaDetails.length === 2 ? 'grid-cols-2' :
                post.mediaDetails.length === 3 ? 'grid-cols-3' :
                post.mediaDetails.length === 4 ? 'grid-cols-2 grid-rows-2' :
                'grid-cols-3'
              }`}>
                {post.mediaDetails.slice(0, post.mediaDetails.length > 5 ? 5 : post.mediaDetails.length).map((media, index) => (
                  <div 
                    key={index} 
                    className={`
                      ${post.mediaDetails && post.mediaDetails.length === 3 && index === 0 ? 'col-span-2' : ''}
                      ${post.mediaDetails && post.mediaDetails.length > 5 && index === 4 ? 'relative' : ''}
                      aspect-square overflow-hidden bg-gray-100
                    `}
                  >
                    <img
                      src={media.url}
                      alt={`Post image ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                    {/* Show count overlay for 6+ images */}
                    {post.mediaDetails && post.mediaDetails.length > 5 && index === 4 && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">
                          +{post.mediaDetails.length - 5}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : post.thumbnailUrl && (
          <div className="aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
            <img
              src={post.thumbnailUrl}
              alt="Post image"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Text */}
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {post.summary}
        </p>

        {/* Tagged Users Display */}
        {post.taggedUsers && post.taggedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">Tagged:</span>
            {post.taggedUsers.map((user, index) => (
              <span key={user.userId} className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                @{user.username}{index < post.taggedUsers!.length - 1 ? ',' : ''}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-6">
            <button className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-red-500">
              <Heart className="w-4 h-4 mr-2" />
              {post.likeCount || 0} Likes
            </button>
            <button className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500">
              <MessageCircle className="w-4 h-4 mr-2" />
              {post.commentCount || 0} Comments
            </button>
            {/* Tagged Users Indicator */}
            {post.taggedUsers && post.taggedUsers.length > 0 && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Users className="w-4 h-4 mr-2" />
                {post.taggedUsers.length} Tagged
              </div>
            )}
          </div>
          <button className="text-gray-600 dark:text-gray-300 hover:text-yellow-500">
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tagged Users Hover Overlay */}
      {showTaggedUsers && post.taggedUsers && post.taggedUsers.length > 0 && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white rounded-lg p-3 z-10 min-w-[200px]">
          <div className="text-sm font-medium mb-2">Tagged Users:</div>
          <div className="space-y-1">
            {post.taggedUsers.map((user) => (
              <div key={user.userId} className="text-xs flex items-center">
                <div className="w-6 h-6 rounded-full bg-gray-600 mr-2 flex items-center justify-center">
                  <span className="text-xs font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                @{user.username}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
