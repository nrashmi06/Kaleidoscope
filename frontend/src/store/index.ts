// src/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage"; 
import authReducer from "@/store/authSlice"; 
import notificationReducer from "@/store/notificationSlice";
import blockReducer from "@/store/blockSlice"; 

// Define persist configs
const authPersistConfig = {
    key: "auth",
    storage,
  };

const notificationPersistConfig = {
    key: "notification",
    storage,
  };

const blockPersistConfig = {
  key: "block",
  storage,
};
  
// Persist reducers 
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedNotificationReducer = persistReducer(notificationPersistConfig, notificationReducer);
const persistedBlockReducer = persistReducer(blockPersistConfig, blockReducer); 

// Create the Redux store
const store = configureStore({
    reducer: {
      auth: persistedAuthReducer,
      notifications: persistedNotificationReducer,
      block: persistedBlockReducer, 
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