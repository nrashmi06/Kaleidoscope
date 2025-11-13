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

// --- UPDATE THIS HELPER ---
const getInitialLabel = (
  isFollowing: boolean, 
  isPending: boolean
): "Follow" | "Following" | "Requested" => {
    if (isFollowing) return "Following";
    if (isPending) return "Requested"; // <-- Add check
    return "Follow";
};


export default function FollowButton({ targetUserId }: FollowButtonProps) {
  const dispatch = useAppDispatch(); 
  const currentUser = useUserData();
  
  const myUserId = currentUser?.userId ? Number(currentUser.userId) : null;
  
  // --- READ BOTH LISTS ---
  const followingUserIds = useAppSelector(state => state.auth.followingUserIds);
  const pendingUserIds = useAppSelector(state => state.auth.pendingRequestUserIds); // <-- Add this
  
  const isTargetFollowing = followingUserIds.includes(targetUserId);
  const isTargetPending = pendingUserIds.includes(targetUserId); // <-- Add this

  const [loading, setLoading] = useState(false);
  
  // --- UPDATE INITIAL STATE ---
  const [label, setLabel] = useState<"Follow" | "Following" | "Requested">(
    getInitialLabel(isTargetFollowing, isTargetPending)
  );

  const disabled = myUserId === targetUserId;

  // --- UPDATE SYNC EFFECT ---
  useEffect(() => {
    if (loading) return; 

    if (isTargetFollowing) {
        setLabel('Following');
    } else if (isTargetPending) {
        setLabel('Requested'); // <-- Add check
    } else {
        setLabel('Follow');
    }
  }, [isTargetFollowing, isTargetPending, loading]); // <-- Add dependency


  const handleFollow = async () => {
    if (disabled || loading) return;
    setLoading(true);
    
    try {
        const result = await dispatch(startFollowUser(targetUserId)).unwrap();
        
        // This local state set is still good for immediate feedback
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
        // This local state set is still good
        setLabel("Follow"); 
    } catch (err) {
        console.error("Error unfollowing user:", err);
        // On failure, Redux rollbacks, and the useEffect hook will restore the label.
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
      className={`px-3 h-8 text-xs font-medium rounded-full transition-colors ${
        loading ? "opacity-60 pointer-events-none" : ""
      } ${
        label === "Following"
          ? "bg-blue-600 text-white hover:bg-blue-700" 
          : label === "Requested"
          ? "bg-yellow-500/10 text-yellow-600 border border-yellow-500 hover:bg-yellow-500/20"
          : "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
      }`}
    >
      {loading ? "..." : label}
    </button>
  );
}