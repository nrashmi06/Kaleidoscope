// src/store/blockThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from './index';
import { addBlockedUserId, removeBlockedUserId, setBlockedUserIds } from './blockSlice';
import { blockUserController } from '@/controllers/user-blocks/blockUserController';
import { unblockUserController } from '@/controllers/user-blocks/unblockUserController';
import { getBlockedUsersController } from '@/controllers/user-blocks/getBlockedUsersController';

// Thunk to fetch and store all blocked user IDs
export const fetchAndStoreBlockedUsers = createAsyncThunk(
  'block/fetchAndStoreBlockedUsers',
  async (_, { getState, dispatch }) => {
    const state = getState() as RootState;
    const token = state.auth.accessToken;
    if (!token) {
      return;
    }

    try {
      const result = await getBlockedUsersController({ page: 0, size: 500 }, token);
      if (result.success && result.data) {
        const blockedIds = result.data.blockedUsers.map(u => u.userId);
        dispatch(setBlockedUserIds(blockedIds));
      } else {
        console.error("Failed to fetch blocked users list:", result.message);
      }
    } catch (error) {
      console.error("Error in fetchAndStoreBlockedUsers thunk:", error);
    }
  }
);

// Thunk for blocking a user
export const startBlockUser = createAsyncThunk(
  'block/startBlockUser',
  async ({ targetUserId, reason }: { targetUserId: number; reason: string }, { getState, dispatch }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (!token) {
      throw new Error("Not authenticated");
    }

    // 1. Optimistic Update
    dispatch(addBlockedUserId(targetUserId));

    // 2. Call API
    const result = await blockUserController(
      { userIdToBlock: targetUserId, reason },
      token
    );

    if (result.success) {
      return { targetUserId, message: result.message };
    } else {
      // 3. Rollback on failure
      dispatch(removeBlockedUserId(targetUserId));
      throw new Error(result.message || "Failed to block user");
    }
  }
);

// Thunk for unblocking a user
export const startUnblockUser = createAsyncThunk(
  'block/startUnblockUser',
  async (targetUserId: number, { getState, dispatch }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (!token) {
      throw new Error("Not authenticated");
    }

    // 1. Optimistic Update
    dispatch(removeBlockedUserId(targetUserId));

    // 2. Call API
    const result = await unblockUserController(
      { userIdToUnblock: targetUserId },
      token
    );

    if (result.success) {
      return { targetUserId, message: result.message };
    } else {
      // 3. Rollback on failure
      dispatch(addBlockedUserId(targetUserId));
      throw new Error(result.message || "Failed to unblock user");
    }
  }
);