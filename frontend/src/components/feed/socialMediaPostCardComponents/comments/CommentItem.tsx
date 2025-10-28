"use client";

import Image from "next/image";
import { CommentItem as CommentType } from "@/lib/types/comment";
import CommentActions from "./CommentActions";

interface CommentItemProps {
  comment: CommentType;
  postId: number;
}

export default function CommentItem({ comment, postId }: CommentItemProps) {
  return (
    <li
      key={comment.commentId}
      className="border-b border-gray-100 dark:border-gray-800 pb-2 last:border-none"
    >
      <article className="flex items-start gap-3">
        <Image
          src={comment.author.profilePictureUrl}
          alt={`${comment.author.username}'s profile`}
          width={32}
          height={32}
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="flex-1">
          <header className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold">{comment.author.username}</span>
            <time
              className="text-gray-400 text-xs"
              dateTime={comment.createdAt}
            >
              {new Date(comment.createdAt).toLocaleDateString()}
            </time>
          </header>

          <p className="text-gray-800 dark:text-gray-200 text-sm leading-snug mt-1">
            {comment.body}
          </p>

          {/* Comment Reactions */}
          <CommentActions postId={postId} commentId={comment.commentId} />
        </div>
      </article>
    </li>
  );
}
