'use client';
import Image from 'next/image';
import { useState } from 'react';
import { Heart, MessageCircle, Bookmark } from 'lucide-react';

interface FeedCardProps {
  username: string;
  handle: string;
  image: string;
  text: string;
  tags: string[];
  userImage?: string;
}

export default function FeedCard({
  username,
  handle,
  image,
  text,
  tags,
  userImage = `/${handle.replace('@', '')}.jpg`,
}: FeedCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const previewText = text.substring(0, 80) + (text.length > 80 ? '...' : '');

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
  };

  return (
    <article className="w-full bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 rounded-lg shadow-sm overflow-hidden mb-4 transition-colors duration-300">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center">
          <div className="relative h-10 w-10 rounded-full overflow-hidden">
            <Image
              src={userImage}
              alt={`${username}'s profile`}
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <div className="ml-3">
            <h3 className="font-medium text-sm">{username}</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{handle}</p>
          </div>
        </div>
      </div>

      {/* Image Grid */}
      <div className="flex gap-2 p-4">
        <div className="relative w-1/2 h-64 overflow-hidden">
          <Image
            src={image}
            alt="Feed image 1"
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-2 w-1/2">
          <div className="relative w-full h-32 overflow-hidden">
            <Image
              src="/nature3.jpg"
              alt="Feed image 2"
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>
          <div className="relative w-full h-32 overflow-hidden">
            <Image
              src="/nature2.jpg"
              alt="Feed image 3"
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between px-4 py-3">
        <div className="flex space-x-4">
          <button
            onClick={handleLike}
            className="flex items-center space-x-1"
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <Heart
              size={20}
              className={liked ? 'fill-red-500 text-red-500' : 'text-neutral-600 dark:text-neutral-300'}
            />
            <span className="text-xs text-neutral-600 dark:text-neutral-300">{likeCount}</span>
          </button>

          <button className="flex items-center space-x-1" aria-label="Comment">
            <MessageCircle size={20} className="text-neutral-600 dark:text-neutral-300" />
            <span className="text-xs text-neutral-600 dark:text-neutral-300">0</span>
          </button>
        </div>

        <button
          onClick={handleBookmark}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <Bookmark
            size={20}
            className={bookmarked
              ? 'fill-neutral-700 text-neutral-700 dark:fill-neutral-300 dark:text-neutral-300'
              : 'text-neutral-600 dark:text-neutral-300'}
          />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <p className="text-sm mb-2">
          {expanded ? text : previewText}
          {text.length > 80 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-blue-500 hover:underline ml-1"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
