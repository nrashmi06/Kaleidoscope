// src/store/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  userId: number;
  email: string;
  username: string;
  role: string;
  accessToken: string;
  profilePictureUrl: string;
  isUserInterestSelected: boolean;
  followingUserIds: number[]; 
  followersUserIds: number[]; 
  pendingRequestUserIds: number[]; // <-- ADD THIS
}

const initialState: AuthState = {
    userId: 0,
    email: "",
    username: "",
    role: "",
    accessToken: "",
    profilePictureUrl: "",
    isUserInterestSelected: false,
    followingUserIds: [], 
    followersUserIds: [],
    pendingRequestUserIds: [], // <-- ADD THIS
  };
  
  const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
      setUser(state, action: PayloadAction<AuthState>) {
        state.userId = action.payload.userId;
        state.email = action.payload.email;
        state.username = action.payload.username;
        state.role = action.payload.role;
        state.accessToken = action.payload.accessToken;
        state.profilePictureUrl = action.payload.profilePictureUrl;
        state.isUserInterestSelected = action.payload.isUserInterestSelected;
        state.followingUserIds = action.payload.followingUserIds || [];
        state.followersUserIds = action.payload.followersUserIds || [];
        state.pendingRequestUserIds = action.payload.pendingRequestUserIds || []; // <-- ADD THIS
      },
      clearUser(state) {
        state.userId = 0;
        state.email = "";
        state.username = "";
        state.role = "";
        state.accessToken = "";
        state.profilePictureUrl = "";
        state.isUserInterestSelected = false;
        state.followingUserIds = []; 
        state.followersUserIds = []; 
        state.pendingRequestUserIds = []; // <-- ADD THIS
      },
      setInterestSelected(state) {
        state.isUserInterestSelected = true;
      },
      clearInterestSelection(state) {
        state.isUserInterestSelected = false;
      },
      // Following Reducers
      setFollowingUserIds(state, action: PayloadAction<number[]>) {
        state.followingUserIds = action.payload;
      },
      addFollowingUserId(state, action: PayloadAction<number>) {
        if (!state.followingUserIds.includes(action.payload)) {
            state.followingUserIds.push(action.payload);
        }
      },
      removeFollowingUserId(state, action: PayloadAction<number>) {
        state.followingUserIds = state.followingUserIds.filter(id => id !== action.payload);
      },
      // Followers Reducers
      setFollowersUserIds(state, action: PayloadAction<number[]>) {
        state.followersUserIds = action.payload;
      },
      addFollowerUserId(state, action: PayloadAction<number>) {
        if (!state.followersUserIds.includes(action.payload)) {
            state.followersUserIds.push(action.payload);
        }
      },
      removeFollowerUserId(state, action: PayloadAction<number>) {
        state.followersUserIds = state.followersUserIds.filter(id => id !== action.payload);
      },
      // --- ADD THESE NEW REDUCERS ---
      setPendingRequestUserIds(state, action: PayloadAction<number[]>) {
        state.pendingRequestUserIds = action.payload;
      },
      addPendingRequestUserId(state, action: PayloadAction<number>) {
        if (!state.pendingRequestUserIds.includes(action.payload)) {
            state.pendingRequestUserIds.push(action.payload);
        }
      },
      removePendingRequestUserId(state, action: PayloadAction<number>) {
        state.pendingRequestUserIds = state.pendingRequestUserIds.filter(id => id !== action.payload);
      },
    },
  });
  
  export const { 
    setUser, 
    clearUser, 
    setInterestSelected, 
    clearInterestSelection, 
    setFollowingUserIds, 
    addFollowingUserId, 
    removeFollowingUserId,
    setFollowersUserIds,
    addFollowerUserId,
    removeFollowerUserId,
    setPendingRequestUserIds,
    addPendingRequestUserId,
    removePendingRequestUserId
  } = authSlice.actions;
  export default authSlice.reducer;