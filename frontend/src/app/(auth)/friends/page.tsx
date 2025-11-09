// src/app/(auth)/friends/page.tsx
"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react"; 
import { useUserData } from "@/hooks/useUserData";
import { getFollowing } from "@/controllers/followController/getFollowingController";
import { fetchFollowersController } from "@/controllers/followController/fetchFollowersController"; 
import type { SuggestedUser } from "@/lib/types/followSuggestions";
import type { FollowerUser } from "@/lib/types/followers"; 
import PendingFollowRequests from "@/components/friends/PendingFollowRequests"; 
import FriendsTabContainer from "@/components/friends/FriendsTabContainer"; 
import { useAppDispatch } from "@/hooks/appDispatch"; 
import { setFollowingUserIds, setFollowersUserIds } from "@/store/authSlice"; 
import { fetchAndStoreFollowers } from "@/store/followThunks"; 
import { useAppSelector } from "@/hooks/useAppSelector"; 

export default function FriendsPage() {
  const currentUser = useUserData();
  const token = currentUser?.accessToken ?? null;
  const userId = currentUser?.userId ? Number(currentUser.userId) : null;
  const dispatch = useAppDispatch(); 
  
  const cachedFollowingIds = useAppSelector(state => state.auth.followingUserIds);

  const [initialFetchedFollowingUsers, setInitialFetchedFollowingUsers] = useState<SuggestedUser[]>([]); 
  const [followingLoading, setFollowingLoading] = useState(false); 
  
  // State for caching FOLLOWERS DATA
  const [initialFetchedFollowers, setInitialFetchedFollowers] = useState<FollowerUser[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followersTotalElements, setFollowersTotalElements] = useState(0);
  
  // ✅ CRITICAL FIX: State to prevent infinite loop on API failure
  const [hasLoadedFollowersOnce, setHasLoadedFollowersOnce] = useState(false); 

  // CALLBACK: Adds the newly followed user object to the local list (for Following tab synchronization).
  const handleNewFollowingUser = useCallback((user: SuggestedUser) => {
      setInitialFetchedFollowingUsers(prev => {
          if (!prev.find(u => u.userId === user.userId)) {
              return [user, ...prev];
          }
          return prev;
      });
  }, []);
  
  const filteredFollowingUsers = useMemo(() => {
    if (initialFetchedFollowingUsers.length === 0 && followingLoading) return []; 
    
    return initialFetchedFollowingUsers.filter(u => cachedFollowingIds.includes(u.userId));
  }, [initialFetchedFollowingUsers, cachedFollowingIds, followingLoading]);
  
  // 1. Fetch FOLLOWING list (Fetches once on mount)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!userId) return;
      setFollowingLoading(true); 
      
      try {
          const res = await getFollowing(token, { userId, page: 0, size: 50 }); 
          
          if (!mounted) return;

          if (res.success && res.data) {
            const fetchedUsers = res.data.data.users ?? [];
            setInitialFetchedFollowingUsers(fetchedUsers); 
            
            const fetchedUserIds = fetchedUsers.map(u => u.userId);
            dispatch(setFollowingUserIds(fetchedUserIds));
          } else {
            setInitialFetchedFollowingUsers([]); 
          }
      } catch (err) {
          console.error("Error fetching following list:", err);
          setInitialFetchedFollowingUsers([]); 
      } finally {
          if (mounted) {
             setFollowingLoading(false); 
          }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [token, userId, dispatch]);

  // 2. Fetch FOLLOWERS list (FIXED Caching Strategy)
  useEffect(() => {
    let mounted = true;
    const loadFollowers = async () => {
      if (!userId || !token) return;
      setFollowersLoading(true);

      try {
        const res = await fetchFollowersController(token, { userId, page: 0, size: 50 });

        if (!mounted) return;

        if (res.success && res.data) {
          const fetchedUsers = res.data.users ?? [];
          setInitialFetchedFollowers(fetchedUsers);
          setFollowersTotalElements(res.data.totalElements);
          
          const fetchedUserIds = fetchedUsers.map(u => u.userId);
          dispatch(setFollowersUserIds(fetchedUserIds)); 
          
        } else {
          setInitialFetchedFollowers([]);
          setFollowersTotalElements(0);
        }
      } catch (err) {
        console.error("Error fetching followers list:", err);
        setInitialFetchedFollowers([]);
        setFollowersTotalElements(0);
      } finally {
        if (mounted) {
          setFollowersLoading(false);
          // ✅ FIX: Mark load attempt as complete to break potential re-fetch loop
          setHasLoadedFollowersOnce(true); 
        }
      }
    };
    
    // ✅ FIX: Only run if the cache is empty AND we haven't loaded once yet
    if (initialFetchedFollowers.length === 0 && !hasLoadedFollowersOnce) {
      loadFollowers();
    }
    
    return () => {
      mounted = false;
    };
  }, [token, userId, dispatch, initialFetchedFollowers.length, hasLoadedFollowersOnce]);
  
  // 3. Redux warm-up on login
  useEffect(() => {
    if (userId && token) {
      dispatch(fetchAndStoreFollowers());
    }
  }, [token, userId, dispatch]);


  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Friends Management
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <PendingFollowRequests />
        </div>
        
        <div className="lg:col-span-2">
          <FriendsTabContainer
            // FOLLOWING PROPS
            followingUsers={filteredFollowingUsers} 
            followingLoading={followingLoading}
            
            // FOLLOWERS CACHED PROPS
            initialFollowers={initialFetchedFollowers}
            initialLoading={followersLoading}
            initialTotalElements={followersTotalElements}
            
            currentUserId={userId}
            onNewFollowingUser={handleNewFollowingUser} 
          />
        </div>
      </div>
    </div>
  );
}