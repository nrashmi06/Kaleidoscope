import { clearUser } from "@/store/authSlice";
import { useAppDispatch } from "./appDispatch";

export default function useClearStore() {
  const dispatch = useAppDispatch();

  const clearStore = () => {
    dispatch(clearUser());
  };

  return clearStore;
}