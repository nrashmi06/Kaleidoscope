import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  userId: string;
  email: string;
  username: string;
  role: string;
  accessToken: string;
  refreshToken: string;
}
// Example to ensure only serializable data is stored in Redux state
const initialState: AuthState = {
    userId: "",
    email: "",
    username: "",
    role: "",
    accessToken: "",
    refreshToken : "",
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
        state.refreshToken = action.payload.refreshToken;
      },
      clearUser(state) {
        state.userId = "";
        state.email = "";
        state.username = "";
        state.role = "";
        state.accessToken = "";
        state.refreshToken = "";
      },
    },
  });
  
  export const { setUser, clearUser } = authSlice.actions;
  export default authSlice.reducer;