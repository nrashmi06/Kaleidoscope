import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface NotificationState {
  count: number;
  connected: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  count: 0,
  connected: false,
  error: null,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setCount(state, action: PayloadAction<number>) {
      state.count = action.payload;
    },
    setConnected(state, action: PayloadAction<boolean>) {
      state.connected = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    resetNotifications(state) {
      state.count = 0;
      state.connected = false;
      state.error = null;
    },
  },
});

export const { setCount, setConnected, setError, resetNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
