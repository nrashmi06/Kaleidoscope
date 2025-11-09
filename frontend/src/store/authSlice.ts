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
  // ✅ FOLLOWING STATE
  followingUserIds: number[]; 
  // ✅ NEW: FOLLOWERS STATE
  followersUserIds: number[]; // <-- Added for persistent caching
}
// Example to ensure only serializable data is stored in Redux state
const initialState: AuthState = {
    userId: 0,
    email: "",
    username: "",
    role: "",
    accessToken: "",
    profilePictureUrl: "",
    isUserInterestSelected: false,
    // ✅ Initialize new states
    followingUserIds: [], 
    followersUserIds: [], // <-- Initialized
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
        // ✅ Preserve new state on login/set
        state.followersUserIds = action.payload.followersUserIds || [];
      },
      clearUser(state) {
        state.userId = 0;
        state.email = "";
        state.username = "";
        state.role = "";
        state.accessToken = "";
        state.profilePictureUrl = "";
        state.isUserInterestSelected = false;
        // ✅ Clear both states on logout
        state.followingUserIds = []; 
        state.followersUserIds = []; 
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
      // ✅ NEW Reducers: Followers
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
    // ✅ Export new actions
    setFollowersUserIds,
    addFollowerUserId,
    removeFollowerUserId
  } = authSlice.actions;
  export default authSlice.reducer;