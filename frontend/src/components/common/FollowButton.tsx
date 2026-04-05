// src/components/common/FollowButton.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useUserData } from "@/hooks/useUserData";
import { useAppDispatch } from "@/hooks/appDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { startFollowUser, startUnfollowUser } from "@/store/followThunks";

interface FollowButtonProps {
  targetUserId: number;
}

const getInitialLabel = (
  isFollowing: boolean,
  isPending: boolean
): "Follow" | "Following" | "Requested" => {
  if (isFollowing) return "Following";
  if (isPending) return "Requested";
  return "Follow";
};

export default function FollowButton({ targetUserId }: FollowButtonProps) {
  const dispatch = useAppDispatch();
  const currentUser = useUserData();

  const myUserId = currentUser?.userId ? Number(currentUser.userId) : null;

  const followingUserIds = useAppSelector(
    (state) => state.auth.followingUserIds
  );
  const pendingUserIds = useAppSelector(
    (state) => state.auth.pendingRequestUserIds
  );

  const isTargetFollowing = followingUserIds.includes(targetUserId);
  const isTargetPending = pendingUserIds.includes(targetUserId);

  const [loading, setLoading] = useState(false);

  const [label, setLabel] = useState<"Follow" | "Following" | "Requested">(
    getInitialLabel(isTargetFollowing, isTargetPending)
  );

  const disabled = myUserId === targetUserId;

  useEffect(() => {
    if (loading) return;

    if (isTargetFollowing) {
      setLabel("Following");
    } else if (isTargetPending) {
      setLabel("Requested");
    } else {
      setLabel("Follow");
    }
  }, [isTargetFollowing, isTargetPending, loading]);

  const handleFollow = async () => {
    if (disabled || loading) return;
    setLoading(true);

    try {
      const result = await dispatch(startFollowUser(targetUserId)).unwrap();

      if (/request/i.test(result.message)) setLabel("Requested");
      else setLabel("Following");
    } catch (err) {
      console.error("Error following user:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (disabled || loading) return;
    setLoading(true);

    try {
      await dispatch(startUnfollowUser(targetUserId)).unwrap();
      setLabel("Follow");
    } catch (err) {
      console.error("Error unfollowing user:", err);
    } finally {
      setLoading(false);
    }
  };

  if (disabled) return null;

  const onClick = label === "Follow" ? handleFollow : handleUnfollow;

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-3 h-8 text-xs font-medium rounded-full transition-colors cursor-pointer ${
        loading ? "opacity-60 pointer-events-none" : ""
      } ${
        label === "Following"
          ? "bg-steel text-cream-50 hover:bg-steel-600 dark:bg-sky dark:text-navy dark:hover:bg-sky-300"
          : label === "Requested"
            ? "bg-sky/10 text-sky border border-sky/30 hover:bg-sky/20"
            : "bg-cream-300/50 dark:bg-navy-700 text-navy dark:text-cream hover:bg-cream-300 dark:hover:bg-navy-600"
      }`}
    >
      {loading ? "..." : label}
    </button>
  );
}
