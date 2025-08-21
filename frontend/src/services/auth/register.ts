import axios, { AxiosError } from 'axios';
import {
  RegisterUserData,
  RegisterUserResponse,
} from '@/lib/types/auth';
import { AuthMapper } from '@/mapper/authMapper';

export const registerUserWithProfile = async (
  userData: RegisterUserData,
  profilePicture: File
): Promise<{ success: boolean; message: string }> => {
  const formData = new FormData();

  formData.append('profilePicture', profilePicture);

  const userDataBlob = new Blob([JSON.stringify(userData)], {
    type: 'application/json',
  });

  formData.append('userData', userDataBlob, 'userData.json');

  try {
    const response = await axios.post<RegisterUserResponse>(
      AuthMapper.register,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return {
      success: response.data.success,
      message: response.data.message,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<RegisterUserResponse>;
      const responseData = axiosError.response?.data;

      return {
        success: false,
        message:
          responseData?.message ||
          axiosError.message ||
          'Registration failed',
      };
    }

    return {
      success: false,
      message: 'Unknown error occurred during registration.',
    };
  }
};
