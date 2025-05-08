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

    // Check if the error is a 401 (Unauthorized) and if we haven't already retried the request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Prevent infinite retry

      try {
        // Dispatch refreshToken action to refresh the access token
        const result = await store.dispatch(refreshToken()); // Dispatch the refresh token action

        if (result.success) {
          // If token refresh is successful, retrieve the new access token from the store
          const state = store.getState(); // Access the current state from the store
          const accessToken = state.auth.accessToken; // Get the updated access token

          if (accessToken) {
            // Retry the original request with the new access token
            originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
            return axiosInstance(originalRequest); // Retry the original request with the new access token
          } else {
            // If no new access token is found, reject the request
            return Promise.reject(new Error("No access token found after refresh"));
          }
        } else {
          // If token refresh fails, reject the request
          return Promise.reject(new Error("Token refresh failed"));
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        return Promise.reject(refreshError); // Reject the request if refresh fails
      }
    }

    // Reject the request if it's not a 401 error or if we failed to refresh the token
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
  