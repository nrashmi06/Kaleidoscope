"use client";

import Image from "next/image";
import { Post } from "@/services/post/fetchPosts";

interface PostMediaProps {
  post: Post;
  fillContainer?: boolean;
}

export function PostMedia({ post, fillContainer = false }: PostMediaProps) {
  const mediaDetails = post.mediaDetails ?? [];

  // Fill container mode — used in wave card layout
  if (fillContainer) {
    if (mediaDetails.length >= 1) {
      return (
        <div className="relative w-full h-full bg-cream-300 dark:bg-navy-700">
          <Image
            src={mediaDetails[0].url}
            alt="Post image"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
          {mediaDetails.length > 1 && (
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
              +{mediaDetails.length - 1}
            </div>
          )}
        </div>
      );
    }

    if (post.thumbnailUrl) {
      return (
        <div className="relative w-full h-full bg-cream-300 dark:bg-navy-700">
          <Image
            src={post.thumbnailUrl}
            alt="Post thumbnail"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>
      );
    }

    return <div className="w-full h-full bg-cream-300 dark:bg-navy-700" />;
  }

  // ── Original mode (used in PostModal, etc.) ──

  const ImageWrapper = ({
    children,
    className = "",
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div
      className={`relative w-full rounded-lg overflow-hidden bg-cream-300 dark:bg-navy-700 ${className}`}
      style={{
        aspectRatio: "4 / 3",
        maxHeight: "400px",
        width: "100%",
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
              className={`relative w-full overflow-hidden bg-cream-300 dark:bg-navy-700 ${
                mediaDetails.length === 3 && index === 0 ? "col-span-2" : ""
              }`}
              style={{ aspectRatio: "1 / 1", maxHeight: "400px" }}
            >
              <Image
                src={media.url}
                alt={`Post image ${index + 1}`}
                fill
                className="object-cover hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 768px) 100vw, 300px"
              />
              {mediaDetails.length > 5 && index === 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
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
