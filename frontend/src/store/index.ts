// src/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage"; // Using localStorage
import authReducer from "@/store/authSlice"; // Adjust the path to your authSlice

// Define  reducers
const authPersistConfig = {
    key: "auth",
    storage,
  };
  
// Persist reducers 
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

// Create the Redux store
const store = configureStore({
    reducer: {
      auth: persistedAuthReducer, // Use the persisted auth reducer
  },
  devTools: process.env.NODE_ENV !== "production",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/REGISTER",
          "persist/FLUSH",
          "persist/PAUSE",
          "persist/PURGE",
        ],
      },
    }),
});

// Create the persistor
const persistor = persistStore(store);

// Export the store and persistor
export { store, persistor };

// Type definitions for convenience in TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
