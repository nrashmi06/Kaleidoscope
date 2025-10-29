import { useSelector } from "react-redux";
import { RootState } from "@/store";

export const useUserData = () => {
  return useSelector((state: RootState) => state.auth);
};
