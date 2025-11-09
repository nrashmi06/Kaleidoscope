// src/components/common/FollowButton.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useUserData } from "@/hooks/useUserData";
import { useAppDispatch } from "@/hooks/appDispatch"; // ✅ NEW IMPORT
import { useAppSelector } from "@/hooks/useAppSelector"; // ✅ NEW IMPORT
import { startFollowUser, startUnfollowUser } from "@/store/followThunks"; // ✅ NEW IMPORT

interface FollowButtonProps {
  targetUserId: number;
}

// Helper to determine initial label state from Redux
const getInitialLabel = (isFollowing: boolean): "Follow" | "Following" => {
    // Only relies on "Following" vs "Follow" from Redux persistence
    if (isFollowing) return "Following";
    return "Follow";
};


export default function FollowButton({ targetUserId }: FollowButtonProps) {
  const dispatch = useAppDispatch(); 
  const currentUser = useUserData();
  
  const myUserId = currentUser?.userId ? Number(currentUser.userId) : null;
  
  // ✅ NEW: Read following status from Redux store
  const followingUserIds = useAppSelector(state => state.auth.followingUserIds);
  const isTargetFollowing = followingUserIds.includes(targetUserId);

  const [loading, setLoading] = useState(false);
  // Initialize status based on the Redux state check
  const [label, setLabel] = useState<"Follow" | "Following" | "Requested">(
    getInitialLabel(isTargetFollowing)
  );

  const disabled = myUserId === targetUserId;

  // ✅ New useEffect to sync local label state when Redux changes
  useEffect(() => {
    // If the component is actively loading (making an API call), don't interrupt.
    if (loading) return; 

    // Update the label based on the latest Redux state
    if (isTargetFollowing) {
        // If the current label is 'Requested', keep it, as that status is more specific 
        // (we can't determine 'Requested' from the simple followingUserIds array).
        // Otherwise, set it to 'Following'.
        setLabel(prev => (prev === 'Requested' ? 'Requested' : 'Following'));
    } else {
        // If the user was removed from the Redux list (via unfollow or rollback)
        setLabel('Follow');
    }
  }, [isTargetFollowing, loading]);


  const handleFollow = async () => {
    if (disabled || loading) return;
    setLoading(true);
    
    // Dispatch the thunk for the follow action
    try {
        const result = await dispatch(startFollowUser(targetUserId)).unwrap();
        
        // Update local label state based on the API response message
        if (/request/i.test(result.message)) setLabel("Requested");
        else setLabel("Following");
        
    } catch (err) {
        // Error handling is handled in the thunk (which rolls back the optimistic update)
        console.error("Error following user:", err);
        setLabel("Follow"); 
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (disabled || loading) return;
    setLoading(true);
    
    // Dispatch the thunk for the unfollow action
    try {
        await dispatch(startUnfollowUser(targetUserId)).unwrap();
        // Set label to 'Follow' on success (Redux state update handled by thunk/rollback)
        setLabel("Follow"); 
    } catch (err) {
        console.error("Error unfollowing user:", err);
        // On failure, Redux rollbacks, and the useEffect hook will restore the label.
    } finally {
      setLoading(false);
    }
  };

  if (disabled) return null;

  // toggle action based on current label
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