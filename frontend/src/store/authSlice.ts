import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  userId: string;
  email: string;
  username: string;
  role: string;
  accessToken: string;
  isUserInterestSelected: boolean;
}
// Example to ensure only serializable data is stored in Redux state
const initialState: AuthState = {
    userId: "",
    email: "",
    username: "",
    role: "",
    accessToken: "",
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
        state.isUserInterestSelected = action.payload.isUserInterestSelected;
      },
      clearUser(state) {
        state.userId = "";
        state.email = "";
        state.username = "";
        state.role = "";
        state.accessToken = "";
        state.isUserInterestSelected = false;
      },
      setInterestSelected(state) {
        state.isUserInterestSelected = true;
      },
    },
  });
  
  export const { setUser, clearUser, setInterestSelected } = authSlice.actions;
  export default authSlice.reducer;