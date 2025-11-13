// src/store/followThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { getFollowing } from "@/controllers/followController/getFollowingController";
import { fetchFollowersController } from '@/controllers/followController/fetchFollowersController'; 
import { RootState } from './index';
import { 
  setFollowingUserIds, 
  addFollowingUserId, 
  removeFollowingUserId,
  setFollowersUserIds,
  // --- IMPORT NEW ACTIONS ---
  setPendingRequestUserIds,
  addPendingRequestUserId,
  removePendingRequestUserId
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
      console.warn("[FollowThunk] Cannot fetch following: Missing token or userId.");
      return;
    }

    const result = await getFollowing(token, { userId, page: 0, size: 500 });

    if (result.success && result.data?.data.users) {
      const followingIds = result.data.data.users.map(u => u.userId);
      dispatch(setFollowingUserIds(followingIds));
      console.log(`[FollowThunk] Stored ${followingIds.length} following IDs in Redux.`);

      // --- ADD THIS LOGIC ---
      // Clean up pending list: remove any IDs that are now confirmed as "following"
      // This handles the case where a request was approved while you were logged out.
      const currentPendingIds = (getState() as RootState).auth.pendingRequestUserIds;
      if (currentPendingIds.length > 0) {
        const newPendingIds = currentPendingIds.filter(id => !followingIds.includes(id));
        dispatch(setPendingRequestUserIds(newPendingIds));
      }
      // --- END OF ADDED LOGIC ---

    } else {
      console.error(`[FollowThunk] Failed to fetch following list: ${result.error}`);
    }
  }
);

// Thunk 2: Fetches the entire list of followers IDs and stores it in Redux.
export const fetchAndStoreFollowers = createAsyncThunk(
  // ... (this thunk is unchanged)
  'follow/fetchAndStoreFollowers',
  async (_, { getState, dispatch }) => {
    const state = getState() as RootState;
    const token = state.auth.accessToken;
    const userId = state.auth.userId;

    if (!token || userId === 0) {
      console.warn("[FollowThunk] Cannot fetch followers: Missing token or userId.");
      return;
    }

    const result = await fetchFollowersController(token, { userId, page: 0, size: 500 });

    if (result.success && result.data?.users) { 
      const followersIds = result.data.users.map(u => u.userId);
      dispatch(setFollowersUserIds(followersIds));
      console.log(`[FollowThunk] Stored ${followersIds.length} followers IDs in Redux.`);
    } else {
      console.error(`[FollowThunk] Failed to fetch followers list: ${result.error}`);
    }
  }
);


// Thunk 3: Handles following a user
export const startFollowUser = createAsyncThunk(
  'follow/startFollowUser',
  async (targetUserId: number, { getState, dispatch }) => {
    const token = (getState() as RootState).auth.accessToken;
    
    // 1. REMOVE optimistic update to `followingUserIds`
    // dispatch(addFollowingUserId(targetUserId)); 
    
    // 2. Call API
    const result = await followUser(token, targetUserId);
    
    if (result.success) {
      // 3a. API returned success
      const msg = result.data?.data || "Requested";

      if (/request/i.test(msg)) {
        // --- ADD TO PENDING LIST ---
        dispatch(addPendingRequestUserId(targetUserId));
      } else {
        // --- ADD TO FOLLOWING LIST ---
        dispatch(addFollowingUserId(targetUserId));
      }
      return { targetUserId, message: msg };

    } else {
      // 3b. API returned failure
      const errorMessage = (result.error || result.data?.message || "").toLowerCase();
      
      if (errorMessage.includes("follow request already exists") || 
          errorMessage.includes("follow request already sent")) {
        
        // --- SYNC STATE: ADD TO PENDING LIST ---
        dispatch(addPendingRequestUserId(targetUserId));
        return { targetUserId, message: "Requested" };
      }
      else {
        // --- This is a REAL failure ---
        throw new Error(errorMessage || "Failed to follow user");
      }
    }
  }
);


// Thunk 4: Handles unfollowing a user
export const startUnfollowUser = createAsyncThunk(
  'follow/startUnfollowUser',
  async (targetUserId: number, { getState, dispatch }) => {
    const token = (getState() as RootState).auth.accessToken;
    
    dispatch(removeFollowingUserId(targetUserId));
    dispatch(removePendingRequestUserId(targetUserId));
    
    // 2. Call API
    const result = await unfollowUser(token, targetUserId);
    
    if (result.success) {
      return { targetUserId, message: "Unfollowed" };
    } else {
      dispatch(addFollowingUserId(targetUserId)); 
      throw new Error(result.error || result.data?.message || "Failed to unfollow user");
    }
  }
);