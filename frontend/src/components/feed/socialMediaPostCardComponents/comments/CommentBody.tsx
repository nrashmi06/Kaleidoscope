"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { CommentTag } from "@/lib/types/comment";

interface Props {
  body: string;
  tags?: CommentTag[];
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function CommentBody({ body, tags = [] }: Props) {
  const router = useRouter();

  if (!tags || tags.length === 0) {
    return <p className="text-navy/80 dark:text-cream/80 text-sm leading-snug mt-1">{body}</p>;
  }

  const usernames = Array.from(new Set(tags.map((t) => t.taggedUsername)));
  if (usernames.length === 0) {
    return <p className="text-navy/80 dark:text-cream/80 text-sm leading-snug mt-1">{body}</p>;
  }

  const escaped = usernames.map(escapeRegex).join("|");
  const re = new RegExp(`((?<![A-Za-z0-9_])@?(?:${escaped})(?![A-Za-z0-9_]))`, "gi");

  const parts = body.split(re);

  const findTagUserId = (username: string): number | undefined => {
    const tag = tags.find(
      (t) => t.taggedUsername.toLowerCase() === username.toLowerCase()
    );
    return tag?.taggedUserId;
  };

  return (
    <p className="text-navy/80 dark:text-cream/80 text-sm leading-snug mt-1">
      {parts.map((part, i) => {
        if (!part) return null;
        const withoutAt = part.startsWith("@") ? part.slice(1) : part;
        const isTagged = usernames.some((u) => u.toLowerCase() === withoutAt.toLowerCase());
        if (isTagged) {
          const display = part.startsWith("@") ? part : `@${part}`;
          const userId = findTagUserId(withoutAt);
          return (
            <span
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                if (userId) router.push(`/profile/${userId}`);
              }}
              className="font-semibold bg-steel/10 dark:bg-sky/10 text-steel dark:text-sky px-1 rounded cursor-pointer hover:underline"
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
