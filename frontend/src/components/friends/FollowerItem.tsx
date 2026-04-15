// src/components/friends/FollowerItem.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { FollowerUser } from "@/lib/types/followers";
import { Mail } from "lucide-react";
import { useAppDispatch } from "@/hooks/appDispatch";
import { startFollowUser, startUnfollowUser } from "@/store/followThunks";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "react-hot-toast";

type FollowActionPayload = { targetUserId: number; message: string };

interface Props {
  user: FollowerUser;
  onItemRemoved: (userId: number) => void;
  onUserFollowed: (user: FollowerUser) => void;
}

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error && typeof error === "object" && "message" in error) {
    return error.message as string;
  }
  return defaultMessage;
};

export default function FollowerItem({ user, onUserFollowed }: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const followingUserIds = useAppSelector(
    (state) => state.auth.followingUserIds
  );
  const pendingUserIds = useAppSelector(
    (state) => state.auth.pendingRequestUserIds
  );

  const isFollowingRedux = followingUserIds.includes(user.userId);
  const isPendingRedux = pendingUserIds.includes(user.userId);

  const [isProcessing, setIsProcessing] = useState(false);

  const getInitialLabel = () => {
    if (isFollowingRedux) return "Following";
    if (isPendingRedux) return "Requested";
    return "Follow Back";
  };
  const [label, setLabel] = useState(getInitialLabel());

  useEffect(() => {
    if (isProcessing) return;
    setLabel(getInitialLabel());
  }, [isFollowingRedux, isPendingRedux, isProcessing]);

  const handleToggleFollow = useCallback(async () => {
    setIsProcessing(true);
    let result: FollowActionPayload;

    if (label === "Following" || label === "Requested") {
      try {
        await dispatch(startUnfollowUser(user.userId)).unwrap();
        toast.success("Unfollowed successfully.");
        setLabel("Follow Back");
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to unfollow."));
      }
    } else {
      try {
        result = await dispatch(startFollowUser(user.userId)).unwrap();
        toast.success(result.message);

        if (/request/i.test(result.message)) {
          setLabel("Requested");
        } else {
          setLabel("Following");
          onUserFollowed(user);
        }
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to follow back."));
      }
    }

    setIsProcessing(false);
  }, [dispatch, user, label, onUserFollowed]);

  const buttonLabel = isProcessing ? "..." : label;

  const buttonClass = isProcessing
    ? "opacity-60 pointer-events-none"
    : label === "Following"
      ? "bg-steel text-cream-50 hover:bg-steel-600 dark:bg-sky dark:text-navy dark:hover:bg-sky-300"
      : label === "Requested"
        ? "bg-sky/10 text-sky border border-sky/30 hover:bg-sky/20"
        : "bg-cream-300/50 dark:bg-navy-700 text-heading hover:bg-cream-300 dark:hover:bg-navy-600";

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-cream-100/50 dark:bg-navy-700/30 border border-border-default hover:bg-cream-300/30 dark:hover:bg-navy-700/50 transition-colors">
      <div
        className="flex items-center gap-3 min-w-0 cursor-pointer"
        onClick={() => router.push(`/profile/${user.userId}`)}
      >
        <div className="w-11 h-11 rounded-full overflow-hidden bg-cream-300 dark:bg-navy-700 ring-2 ring-cream-300/50 dark:ring-navy-600/50 flex-shrink-0">
          <Image
            src={user.profilePictureUrl || "/person.jpg"}
            width={44}
            height={44}
            alt={user.username}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-heading truncate hover:underline">
            {user.username}
          </div>
          <div className="text-[11px] text-steel dark:text-sky/60 flex items-center gap-1 mt-0.5">
            <Mail className="w-3 h-3" />
            <span className="truncate">{user.email}</span>
          </div>
        </div>
      </div>

      <div>
        <button
          onClick={handleToggleFollow}
          disabled={isProcessing}
          className={`px-3 h-8 text-xs font-medium rounded-full transition-colors cursor-pointer ${buttonClass}`}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
