"use client";

import Image from "next/image";
import { Post } from "@/services/post/fetchPosts";

interface PostMediaProps {
  post: Post;
}

export function PostMedia({ post }: PostMediaProps) {
  const mediaDetails = post.mediaDetails ?? [];

  // Wrapper for single image or fallback
  const ImageWrapper = ({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div
      className={`relative w-full rounded-lg overflow-hidden bg-gray-100 ${className}`}
      style={{
        aspectRatio: "4 / 3", // ensures height is calculated
        maxHeight: "400px",   // limit max height
        width: "100%",         // fill parent width
      }}
    >
      {children}
    </div>
  );

  // Single media
  if (mediaDetails.length === 1) {
    return (
      <ImageWrapper>
        <Image
          src={mediaDetails[0].url}
          alt="Post image"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 600px"
        />
      </ImageWrapper>
    );
  }

  // Multiple media grid
  if (mediaDetails.length > 1) {
    const gridLayout =
      mediaDetails.length === 2
        ? "grid-cols-2"
        : mediaDetails.length === 3
        ? "grid-cols-3"
        : mediaDetails.length === 4
        ? "grid-cols-2 grid-rows-2"
        : "grid-cols-3";

    return (
      <div className={`w-full grid gap-1 rounded-lg overflow-hidden ${gridLayout}`}>
        {mediaDetails
          .slice(0, Math.min(mediaDetails.length, 5))
          .map((media, index) => (
            <div
              key={index}
              className={`relative w-full overflow-hidden bg-gray-100 ${
                mediaDetails.length === 3 && index === 0 ? "col-span-2" : ""
              }`}
              style={{ aspectRatio: "1 / 1", maxHeight: "400px" }} // square items
            >
              <Image
                src={media.url}
                alt={`Post image ${index + 1}`}
                fill
                className="object-cover hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 768px) 100vw, 300px"
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
      <ImageWrapper>
        <Image
          src={post.thumbnailUrl}
          alt="Post thumbnail"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 600px"
        />
      </ImageWrapper>
    );
  }

  return null;
}
