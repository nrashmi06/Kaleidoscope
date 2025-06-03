import axios, { AxiosError, isAxiosError } from "axios";
import { store } from "@/store"; // Import store to dispatch refresh token action
import { refreshToken } from "@/services/auth/refresh-token"; // Your refresh token function

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config; 
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; 

      try {
        const result = await store.dispatch(refreshToken());

        if (result.success) {
          const state = store.getState();
          const accessToken = state.auth.accessToken;

          if (accessToken) {
            originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
            return axiosInstance(originalRequest);
          } else {
            return Promise.reject(new Error("No access token found after refresh"));
          }
        } else {
          return Promise.reject(new Error("Token refresh failed"));
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        return Promise.reject(refreshError); 
      }
    }

    return Promise.reject(error);
  }
);

export {
    axiosInstance as default,
    axiosInstance,
    axios,            
    isAxiosError,
    AxiosError,
  };
  