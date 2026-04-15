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
import { Users2 } from "lucide-react";

export default function FriendsPage() {
  const currentUser = useUserData();
  const token = currentUser?.accessToken ?? null;
  const userId = currentUser?.userId ? Number(currentUser.userId) : null;
  const dispatch = useAppDispatch();

  const cachedFollowingIds = useAppSelector(
    (state) => state.auth.followingUserIds
  );

  const [initialFetchedFollowingUsers, setInitialFetchedFollowingUsers] =
    useState<SuggestedUser[]>([]);
  const [followingLoading, setFollowingLoading] = useState(false);

  const [initialFetchedFollowers, setInitialFetchedFollowers] = useState<
    FollowerUser[]
  >([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followersTotalElements, setFollowersTotalElements] = useState(0);

  const [hasLoadedFollowersOnce, setHasLoadedFollowersOnce] = useState(false);

  const handleNewFollowingUser = useCallback((user: SuggestedUser) => {
    setInitialFetchedFollowingUsers((prev) => {
      if (!prev.find((u) => u.userId === user.userId)) {
        return [user, ...prev];
      }
      return prev;
    });
  }, []);

  const filteredFollowingUsers = useMemo(() => {
    if (initialFetchedFollowingUsers.length === 0 && followingLoading)
      return [];

    return initialFetchedFollowingUsers.filter((u) =>
      cachedFollowingIds.includes(u.userId)
    );
  }, [initialFetchedFollowingUsers, cachedFollowingIds, followingLoading]);

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

          const fetchedUserIds = fetchedUsers.map((u) => u.userId);
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

  useEffect(() => {
    let mounted = true;
    const loadFollowers = async () => {
      if (!userId || !token) return;
      setFollowersLoading(true);

      try {
        const res = await fetchFollowersController(token, {
          userId,
          page: 0,
          size: 50,
        });

        if (!mounted) return;

        if (res.success && res.data) {
          const fetchedUsers = res.data.users ?? [];
          setInitialFetchedFollowers(fetchedUsers);
          setFollowersTotalElements(res.data.totalElements);

          const fetchedUserIds = fetchedUsers.map((u) => u.userId);
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
          setHasLoadedFollowersOnce(true);
        }
      }
    };

    if (initialFetchedFollowers.length === 0 && !hasLoadedFollowersOnce) {
      loadFollowers();
    }

    return () => {
      mounted = false;
    };
  }, [
    token,
    userId,
    dispatch,
    initialFetchedFollowers.length,
    hasLoadedFollowersOnce,
  ]);

  useEffect(() => {
    if (userId && token) {
      dispatch(fetchAndStoreFollowers());
    }
  }, [token, userId, dispatch]);

  return (
    <div className="min-h-screen w-full relative">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-steel/[0.05] dark:bg-steel/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-[10%] w-80 h-80 bg-sky/[0.05] dark:bg-sky/[0.02] rounded-full blur-[80px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-steel to-navy shadow-lg shadow-steel/25 dark:shadow-steel/15">
            <Users2 className="w-5 h-5 text-cream-50" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-navy dark:text-cream tracking-tight">
              Friends
            </h1>
            <p className="text-[11px] text-steel dark:text-sky">
              Manage your connections
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <PendingFollowRequests />

          <FriendsTabContainer
            followingUsers={filteredFollowingUsers}
            followingLoading={followingLoading}
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
