"use client";

import React from "react";
import type { CommentTag } from "@/lib/types/comment";

interface Props {
  body: string;
  tags?: CommentTag[];
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function CommentBody({ body, tags = [] }: Props) {
  if (!tags || tags.length === 0) {
    return <p className="text-gray-800 dark:text-gray-200 text-sm leading-snug mt-1">{body}</p>;
  }

  // build a regex that matches any tagged username as a whole word, optionally prefixed with @
  const usernames = Array.from(new Set(tags.map((t) => t.taggedUsername)));
  if (usernames.length === 0) {
    return <p className="text-gray-800 dark:text-gray-200 text-sm leading-snug mt-1">{body}</p>;
  }

  const escaped = usernames.map(escapeRegex).join("|");
  // Use negative lookaround to ensure we match whole usernames (handles dots, hyphens, etc.)
  // Match optional leading @ and ensure the match is not part of a larger word
  const re = new RegExp(`((?<![A-Za-z0-9_])@?(?:${escaped})(?![A-Za-z0-9_]))`, "gi");

  const parts = body.split(re);

  return (
    <p className="text-gray-800 dark:text-gray-200 text-sm leading-snug mt-1">
      {parts.map((part, i) => {
        if (!part) return null;
        const withoutAt = part.startsWith("@") ? part.slice(1) : part;
        const isTagged = usernames.some((u) => u.toLowerCase() === withoutAt.toLowerCase());
        if (isTagged) {
          // display the original match but ensure it starts with @ for consistency
          const display = part.startsWith("@") ? part : `@${part}`;
          return (
            <span
              key={i}
              className="font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-1 rounded"
            >
              {display}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
