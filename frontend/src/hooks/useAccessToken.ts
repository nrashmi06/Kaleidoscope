import { useSelector } from "react-redux";
import { RootState } from "@/store";

export const useAccessToken = () => {
  return useSelector((state: RootState) => state.auth.accessToken);
};
