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
  // ✅ NEW STATE
  followingUserIds: number[]; 
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
    // ✅ Initialize new state
    followingUserIds: [], 
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
        // ✅ Preserve followingUserIds on login/set
        state.followingUserIds = action.payload.followingUserIds || [];
      },
      clearUser(state) {
        state.userId = 0;
        state.email = "";
        state.username = "";
        state.role = "";
        state.accessToken = "";
        state.profilePictureUrl = "";
        state.isUserInterestSelected = false;
        // ✅ Clear followingUserIds on logout
        state.followingUserIds = []; 
      },
      setInterestSelected(state) {
        state.isUserInterestSelected = true;
      },
      clearInterestSelection(state) {
        state.isUserInterestSelected = false;
      },
      // ✅ NEW REDUCER: Set the full list of IDs (used by thunk/friends page)
      setFollowingUserIds(state, action: PayloadAction<number[]>) {
        state.followingUserIds = action.payload;
      },
      // ✅ NEW REDUCER: Add a single ID (for optimistic follow)
      addFollowingUserId(state, action: PayloadAction<number>) {
        if (!state.followingUserIds.includes(action.payload)) {
            state.followingUserIds.push(action.payload);
        }
      },
      // ✅ NEW REDUCER: Remove a single ID (for optimistic unfollow)
      removeFollowingUserId(state, action: PayloadAction<number>) {
        state.followingUserIds = state.followingUserIds.filter(id => id !== action.payload);
      },
    },
  });
  
  export const { setUser, clearUser, setInterestSelected, clearInterestSelection, setFollowingUserIds, addFollowingUserId, removeFollowingUserId } = authSlice.actions;
  export default authSlice.reducer;