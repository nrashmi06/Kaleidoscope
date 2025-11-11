// src/hooks/clearStore.ts
import { clearUser } from "@/store/authSlice";
import { clearBlockedUsers } from "@/store/blockSlice"; 
import { useAppDispatch } from "./appDispatch";

export default function useClearStore() {
  const dispatch = useAppDispatch();

  const clearStore = () => {
    dispatch(clearUser());
    dispatch(clearBlockedUsers());
  };

  return clearStore;
}