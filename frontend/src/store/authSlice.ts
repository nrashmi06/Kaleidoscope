import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  userId: string;
  email: string;
  username: string;
  role: string;
  accessToken: string;
}

const initialState: AuthState = {
  userId: "",
  email: "",
  username: "",
  role: "",
  accessToken: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthState>) => {
      return { ...state, ...action.payload };
    },
    clearUser: () => {
      return { ...initialState };
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
