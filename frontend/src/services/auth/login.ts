import axios, { AxiosError } from 'axios';
import { LoginUserData, LoginUserResponse, ErrorResponse } from '@/lib/types/auth';
import { AuthMapper } from '@/mapper/authMapper';
import { AppDispatch } from "@/store/index";
import { setUser } from '@/store/authSlice';

export const loginUser = async (
  credentials: LoginUserData,
  dispatch: AppDispatch
): Promise<{ success: boolean; data?: LoginUserResponse; message: string }> => {
  try {
    const response = await axios.post<LoginUserResponse>(AuthMapper.login, credentials);
    const accessToken = response.headers["authorization"]?.startsWith(
        "Bearer "
      )
        ? response.headers["authorization"].slice(7)
        : null;
    dispatch(
        setUser({
              userId: response.data.userId,
              username: response.data.username,
              email: response.data.email,
              role: response.data.role,
              accessToken: accessToken,
         }));

    return {
      success: true,
      data: response.data,
      message: 'Login successful',
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ErrorResponse>;
        const errData = axiosError.response?.data || { message: axiosError.message };
        return {
          success: false,
          message: typeof errData.message === 'string' ? errData.message : 'Registration failed'
        };
    }

    return {
      success: false,
      message: 'Unexpected error during login',
    };
  }
};
