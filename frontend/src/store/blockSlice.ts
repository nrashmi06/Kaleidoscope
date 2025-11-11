// src/store/blockSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface BlockState {
  blockedUserIds: number[];
}

const initialState: BlockState = {
  blockedUserIds: [],
};

const blockSlice = createSlice({
  name: "block",
  initialState,
  reducers: {
    setBlockedUserIds(state, action: PayloadAction<number[]>) {
      state.blockedUserIds = action.payload;
    },
    addBlockedUserId(state, action: PayloadAction<number>) {
      if (!state.blockedUserIds.includes(action.payload)) {
        state.blockedUserIds.push(action.payload);
      }
    },
    removeBlockedUserId(state, action: PayloadAction<number>) {
      state.blockedUserIds = state.blockedUserIds.filter(
        (id) => id !== action.payload
      );
    },
    clearBlockedUsers(state) {
      state.blockedUserIds = [];
    },
  },
});

export const {
  setBlockedUserIds,
  addBlockedUserId,
  removeBlockedUserId,
  clearBlockedUsers,
} = blockSlice.actions;

export default blockSlice.reducer;