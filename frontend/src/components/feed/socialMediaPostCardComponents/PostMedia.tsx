"use client";

import Image from "next/image";
import { Post } from "@/services/post/fetchPosts";

interface PostMediaProps {
  post: Post;
}

export function PostMedia({ post }: PostMediaProps) {
  const mediaDetails = post.mediaDetails ?? []; 

  // Single media
  if (mediaDetails.length === 1) {
    return (
      <div className="aspect-[4/3] overflow-hidden rounded-lg bg-gray-100 relative">
        <Image
          src={mediaDetails[0].url}
          alt="Post image"
          fill
          className="object-cover"
          sizes="400px"
        />
      </div>
    );
  }

  // Multiple media grid
  if (mediaDetails.length > 1) {
    return (
      <div
        className={`grid gap-1 rounded-lg overflow-hidden ${
          mediaDetails.length === 2
            ? "grid-cols-2"
            : mediaDetails.length === 3
            ? "grid-cols-3"
            : mediaDetails.length === 4
            ? "grid-cols-2 grid-rows-2"
            : "grid-cols-3"
        }`}
      >
        {mediaDetails
          .slice(0, mediaDetails.length > 5 ? 5 : mediaDetails.length)
          .map((media, index) => (
            <div
              key={index}
              className={`aspect-square overflow-hidden bg-gray-100 relative ${
                mediaDetails.length === 3 && index === 0 ? "col-span-2" : ""
              } ${mediaDetails.length > 5 && index === 4 ? "relative" : ""}`}
            >
              <Image
                src={media.url}
                alt={`Post image ${index + 1}`}
                fill
                className="object-cover hover:scale-105 transition-transform duration-200"
                sizes="200px"
              />
              {mediaDetails.length > 5 && index === 4 && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    +{mediaDetails.length - 5}
                  </span>
                </div>
              )}
            </div>
          ))}
      </div>
    );
  }

  // Fallback thumbnail
  if (post.thumbnailUrl) {
    return (
      <div className="aspect-[4/3] overflow-hidden rounded-lg bg-gray-100 relative">
        <Image
          src={post.thumbnailUrl}
          alt="Post image"
          fill
          className="object-cover"
          sizes="400px"
        />
      </div>
    );
  }

  return null;
}
