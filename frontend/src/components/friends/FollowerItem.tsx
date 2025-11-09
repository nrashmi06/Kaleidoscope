// src/components/friends/FollowerItem.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import type { FollowerUser } from "@/lib/types/followers"; 
import { Mail } from "lucide-react"; 
import { useAppDispatch } from "@/hooks/appDispatch";
import { startFollowUser, startUnfollowUser } from "@/store/followThunks"; 
import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "react-hot-toast";

type FollowActionPayload = { targetUserId: number; message: string; };

interface Props {
  user: FollowerUser;
  // This prop should only remove the user if they were followed back/accepted,
  // but NOT when we unfollow them.
  onItemRemoved: (userId: number) => void; 
  onUserFollowed: (user: FollowerUser) => void;
}

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
    if (error && typeof error === 'object' && 'message' in error) {
        return error.message as string;
    }
    return defaultMessage;
};

export default function FollowerItem({ user, onUserFollowed }: Props) {
  const dispatch = useAppDispatch();
  // Reading following status directly from Redux is correct and already implemented
  const followingUserIds = useAppSelector(state => state.auth.followingUserIds);
  const isFollowingRedux = followingUserIds.includes(user.userId);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [label, setLabel] = useState(isFollowingRedux ? "Following" : "Follow Back");

  // Sync label with Redux state on mount or external change
  // This useEffect ensures the button updates immediately if the Redux state changes externally.
  useEffect(() => {
      setLabel(isFollowingRedux ? "Following" : "Follow Back");
  }, [isFollowingRedux]);


  const handleToggleFollow = useCallback(async () => {
    setIsProcessing(true);
    let result: FollowActionPayload; 
    
    if (isFollowingRedux) {
        // --- ACTION: UNFOLLOW ---
        try {
          // 1. Dispatch Unfollow action (updates Redux cache optimistically)
          result = await dispatch(startUnfollowUser(user.userId)).unwrap();
          toast.success("Unfollowed successfully.");
          
          // ❌ REMOVAL FIX: DO NOT call onItemRemoved here.
          // The user is still a follower, so they must remain in this list.
          // The button text changes via the useEffect listening to isFollowingRedux.
          
        } catch (error) { 
          toast.error(getErrorMessage(error, "Failed to unfollow."));
        }
    } else {
        // --- ACTION: FOLLOW BACK ---
        try {
          result = await dispatch(startFollowUser(user.userId)).unwrap();
          toast.success(result.message);
          
          if (/request/i.test(result.message)) {
              setLabel("Requested");
          } else {
             setLabel("Following");
             // ✅ CRITICAL: Add the user object to the parent page's state 
             // to ensure they show up in the Following tab list immediately.
             onUserFollowed(user); 
          }

        } catch (error) { 
          toast.error(getErrorMessage(error, "Failed to follow back."));
        }
    }
    
    setIsProcessing(false);
    
  }, [dispatch, user, isFollowingRedux, onUserFollowed]); // Removed onItemRemoved from dependencies as it's not used here anymore


  // Styles derived from FollowButton.tsx for consistency
  const buttonLabel = isProcessing 
      ? "..." 
      : isFollowingRedux 
      ? "Following" 
      : (label === "Requested" ? "Requested" : "Follow Back");

  const buttonClass = isProcessing ? 
      "opacity-60 pointer-events-none" : 
      isFollowingRedux ? 
      "bg-blue-600 text-white hover:bg-blue-700" : 
      label === "Requested" ? 
      "bg-yellow-500/10 text-yellow-600 border border-yellow-500 hover:bg-yellow-500/20" : 
      "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700";


  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors duration-200 border border-gray-200 dark:border-neutral-700 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300 dark:bg-neutral-700 flex-shrink-0">
          <Image
            src={user.profilePictureUrl || "/person.jpg"}
            width={48}
            height={48}
            alt={user.username}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="min-w-0">
          <div className="text-base font-semibold text-gray-800 dark:text-white truncate">{user.username}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
            <Mail className="w-3 h-3" />
            <span className="truncate">{user.email}</span>
          </div>
        </div>
      </div>

      <div>
        <button
            onClick={handleToggleFollow}
            disabled={isProcessing}
            className={`px-3 h-8 text-xs font-medium rounded-full transition-colors ${buttonClass}`}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}