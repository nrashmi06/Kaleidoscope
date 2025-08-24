import axios, { AxiosError } from 'axios';
import {
  LoginUserData,
  LoginUserPayload,
  LoginUserResponse
} from '@/lib/types/auth';
import { AuthMapper } from '@/mapper/authMapper';
import { AppDispatch } from '@/store/index';
import { setUser } from '@/store/authSlice';

export const loginUser = async (
  credentials: LoginUserData,
  dispatch: AppDispatch
): Promise<{ success: boolean; data?: LoginUserPayload; message: string }> => {
  try {
    const response = await axios.post<LoginUserResponse>(
      AuthMapper.login,
      credentials
    );

    const apiResponse = response.data;

    if (!apiResponse.success) {
      return {
        success: false,
        message: apiResponse.message || 'Login failed',
      };
    }

    const userData = apiResponse.data;

    const accessToken = response.headers['authorization']?.startsWith('Bearer ')
      ? response.headers['authorization'].slice(7)
      : userData.accessToken;

    // Decode JWT token to get isUserInterestSelected
    let isUserInterestSelected = false;
    try {
      const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
      isUserInterestSelected = tokenPayload.isUserInterestSelected || false;
    } catch (error) {
      console.error('Error decoding JWT token:', error);
    }

    dispatch(
      setUser({
        userId: userData.userId,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        accessToken,
        isUserInterestSelected,
      })
    );

    return {
      success: true,
      data: userData,
      message: apiResponse.message,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<LoginUserResponse>;
      const errorResponse = axiosError.response?.data;

      return {
        success: false,
        message:
          errorResponse?.errors?.[0] ||
          errorResponse?.message ||
          'Login failed',
      };
    }

    return {
      success: false,
      message: 'Unexpected error during login',
    };
  }
};
