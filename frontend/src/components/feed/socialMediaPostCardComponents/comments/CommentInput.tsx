"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import Image from "next/image";
import { Send } from "lucide-react";
import { getTaggableUsersController } from "@/controllers/userTagController/getTaggableUsersController";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useDebounce } from "@/hooks/useDebounce";
import { TaggableUser, PaginatedTaggableUserData } from "@/lib/types/usertag";

interface CommentInputProps {
  currentUser: {
    username: string;
    profilePictureUrl: string;
    userId: number;
  };
  onSubmit: (
    comment: string,
    selectedTags?: TaggableUser[] | null
  ) => Promise<void>;
  isPosting: boolean;
}

export default function CommentInput({
  currentUser,
  onSubmit,
  isPosting,
}: CommentInputProps) {
  const [comment, setComment] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<TaggableUser[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedTags, setSelectedTags] = useState<TaggableUser[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const accessToken = useAccessToken();

  const debouncedQuery = useDebounce(searchQuery, 400);

  useEffect(() => {
    const match = comment.match(/@(\w{1,20})$/);
    if (match) {
      setSearchQuery(match[1]);
    } else {
      setSearchQuery("");
      setShowDropdown(false);
    }
  }, [comment]);

  useEffect(() => {
    if (!debouncedQuery) return;

    (async () => {
      const res = await getTaggableUsersController(accessToken, debouncedQuery, 0, 10);

      if (res.success && res.data) {
        const paginatedData: PaginatedTaggableUserData = res.data;
        setResults(paginatedData.content);
        setShowDropdown(paginatedData.content.length > 0);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    })();
  }, [debouncedQuery, accessToken]);

  const handleSend = async () => {
    let trimmed = comment.trim();
    if (!trimmed) return;

    if (selectedTags && selectedTags.length > 0) {
      for (const tag of selectedTags) {
        const regex = new RegExp(`@${tag.username}`);
        trimmed = trimmed.replace(regex, tag.username);
      }
    }

    await onSubmit(trimmed, selectedTags.length > 0 ? selectedTags : null);
    setComment("");
    setShowDropdown(false);
    setSelectedTags([]);
  };

  const handleUserSelect = (user: TaggableUser) => {
    const updated = comment.replace(/@\w*$/, `@${user.username} `);
    setComment(updated);
    setShowDropdown(false);
    setSelectedTags((prev) => {
      if (prev.find((p) => p.userId === user.userId)) return prev;
      return [...prev, user];
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown && results.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleUserSelect(results[activeIndex]);
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex items-center gap-3 mb-4">
        <Image
          src={currentUser.profilePictureUrl}
          alt={`${currentUser.username}'s avatar`}
          width={36}
          height={36}
          className="w-9 h-9 rounded-full object-cover border border-cream-300 dark:border-navy-700"
        />
        <div className="flex-1 flex items-center bg-surface rounded-full border border-border-default px-3 py-1.5 focus-within:ring-1 focus-within:ring-steel/30 dark:focus-within:ring-sky/30 transition">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment..."
            className="flex-1 bg-transparent outline-none text-sm text-heading placeholder-steel/40 dark:placeholder-sky/30"
            disabled={isPosting}
          />
          <button
            onClick={handleSend}
            disabled={!comment.trim() || isPosting}
            className={`p-1.5 transition-all rounded-full ${
              !comment.trim() || isPosting
                ? "text-steel/40 cursor-not-allowed"
                : "text-steel dark:text-sky hover:text-steel-600 dark:hover:text-sky/80"
            }`}
          >
            {isPosting ? (
              <span className="animate-pulse text-xs text-steel/50">...</span>
            ) : (
              <Send size={16} strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute left-12 bottom-0 translate-y-full mt-1 w-64 bg-cream-50 dark:bg-navy border border-cream-300 dark:border-navy-700 rounded-xl shadow-lg shadow-navy/10 dark:shadow-black/30 overflow-hidden z-20">
          {results.map((user, idx) => (
            <button
              key={user.userId}
              onClick={() => handleUserSelect(user)}
              className={`flex items-center w-full px-3 py-2 text-sm text-left ${
                idx === activeIndex
                  ? "bg-steel/10 dark:bg-sky/10"
                  : "hover:bg-surface-hover"
              }`}
            >
              <Image
                src={user.profilePictureUrl}
                alt={user.username}
                width={28}
                height={28}
                className="rounded-full mr-2 object-cover"
              />
              <span className="text-heading">@{user.username}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
