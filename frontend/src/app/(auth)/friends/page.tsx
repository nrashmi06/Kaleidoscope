// src/app/(auth)/friends/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useUserData } from "@/hooks/useUserData";
import { getFollowing } from "@/controllers/followController/getFollowingController";
import type { SuggestedUser } from "@/lib/types/followSuggestions";
import PendingFollowRequests from "@/components/friends/PendingFollowRequests"; 
import FriendsTabContainer from "@/components/friends/FriendsTabContainer"; // ✅ NEW IMPORT
import { useAppDispatch } from "@/hooks/appDispatch"; 
import { setFollowingUserIds } from "@/store/authSlice"; 

export default function FriendsPage() {
  const currentUser = useUserData();
  const token = currentUser?.accessToken ?? null;
  const userId = currentUser?.userId ? Number(currentUser.userId) : null;
  const dispatch = useAppDispatch(); 

  const [followingUsers, setFollowingUsers] = useState<SuggestedUser[]>([]);
  const [followingLoading, setFollowingLoading] = useState(false); // ✅ Added state for loading

  // Initial fetch for FOLLOWING list (needed for count/initial state)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!userId) return;
      setFollowingLoading(true); 
      
      const res = await getFollowing(token, { userId, page: 0, size: 50 }); 
      
      if (!mounted) return;

      if (res.success && res.data) {
        const fetchedUsers = res.data.data.users ?? [];
        setFollowingUsers(fetchedUsers); 
        
        const fetchedUserIds = fetchedUsers.map(u => u.userId);
        dispatch(setFollowingUserIds(fetchedUserIds));
      }
      setFollowingLoading(false); 
    };
    load();
    return () => {
      mounted = false;
    };
  }, [token, userId, dispatch]);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Friends Management
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1/3 width on large screens) - Dedicated for Pending Requests */}
        <div className="lg:col-span-1 space-y-6">
          <PendingFollowRequests />
          {/* FollowSuggestions can optionally be placed here */}
        </div>
        
        {/* Right Column (2/3 width on large screens) - Tabbed Content */}
        <div className="lg:col-span-2">
          <FriendsTabContainer
            followingUsers={followingUsers}
            followingLoading={followingLoading}
            currentUserId={userId}
          />
        </div>
      </div>
    </div>
  );
}