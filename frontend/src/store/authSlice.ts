import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  userId: number;
  email: string;
  username: string;
  role: string;
  accessToken: string;
  profilePictureUrl: string;
  isUserInterestSelected: boolean;
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
      },
      clearUser(state) {
        state.userId = 0;
        state.email = "";
        state.username = "";
        state.role = "";
        state.accessToken = "";
        state.profilePictureUrl = "";
        state.isUserInterestSelected = false;
      },
      setInterestSelected(state) {
        state.isUserInterestSelected = true;
      },
      clearInterestSelection(state) {
        state.isUserInterestSelected = false;
      },
    },
  });
  
  export const { setUser, clearUser, setInterestSelected, clearInterestSelection } = authSlice.actions;
  export default authSlice.reducer;