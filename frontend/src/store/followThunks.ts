// src/store/followThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { getFollowing } from "@/controllers/followController/getFollowingController";
import { RootState } from './index';
import { 
  setFollowingUserIds, 
  addFollowingUserId, 
  removeFollowingUserId 
} from './authSlice';
import { followUser, unfollowUser } from '@/controllers/followController/followController'; 

// Thunk 1: Fetches the entire list of following IDs and stores it in Redux.
export const fetchAndStoreFollowing = createAsyncThunk(
  'follow/fetchAndStoreFollowing',
  async (_, { getState, dispatch }) => {
    const state = getState() as RootState;
    const token = state.auth.accessToken;
    const userId = state.auth.userId;

    if (!token || userId === 0) {
      console.warn("Cannot fetch following: Missing token or userId.");
      return;
    }

    // Fetch a large page size to cover most following lists on login/page load
    const result = await getFollowing(token, { userId, page: 0, size: 500 });

    if (result.success && result.data?.data.users) {
      const followingIds = result.data.data.users.map(u => u.userId);
      dispatch(setFollowingUserIds(followingIds));
      console.log(`[FollowThunk] Stored ${followingIds.length} following IDs in Redux.`);
    } else {
      console.error(`[FollowThunk] Failed to fetch following list: ${result.error}`);
    }
  }
);


// Thunk 2: Handles following a user with optimistic update
export const startFollowUser = createAsyncThunk(
  'follow/startFollowUser',
  async (targetUserId: number, { getState, dispatch }) => {
    const token = (getState() as RootState).auth.accessToken;
    
    // 1. Optimistic Update (Assume success)
    dispatch(addFollowingUserId(targetUserId));
    
    // 2. Call API
    const result = await followUser(token, targetUserId);
    
    if (result.success) {
      // Success: Return new status message for UI update
      const msg = result.data?.data || "Requested";
      return { targetUserId, message: msg };
    } else {
      // Failure: Rollback optimistic update
      dispatch(removeFollowingUserId(targetUserId));
      throw new Error(result.error || result.data?.message || "Failed to follow user");
    }
  }
);


// Thunk 3: Handles unfollowing a user with optimistic update
export const startUnfollowUser = createAsyncThunk(
  'follow/startUnfollowUser',
  async (targetUserId: number, { getState, dispatch }) => {
    const token = (getState() as RootState).auth.accessToken;
    
    // 1. Optimistic Update (Assume success)
    dispatch(removeFollowingUserId(targetUserId));
    
    // 2. Call API
    const result = await unfollowUser(token, targetUserId);
    
    if (result.success) {
      // Success: Return new status message for UI update
      return { targetUserId, message: "Unfollowed" };
    } else {
      // Failure: Rollback optimistic update (add back)
      dispatch(addFollowingUserId(targetUserId));
      throw new Error(result.error || result.data?.message || "Failed to unfollow user");
    }
  }
);