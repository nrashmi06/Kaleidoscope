import axios, { AxiosError } from 'axios';
import { RegisterUserData, RegisterUserResponse, ErrorResponse } from '@/lib/types/auth';
import { AuthMapper } from '@/mapper/authMapper';

export const registerUserWithProfile = async (
    userData: RegisterUserData,
    profilePicture: File | null
): Promise<{ success: boolean; message: string }> => {
  const formData = new FormData();

  // Append profile picture first if exists
  if (profilePicture) {
    formData.append('profilePicture', profilePicture);
  }

  // Create a Blob for userData and append it with a filename
  const userDataBlob = new Blob([JSON.stringify(userData)], {
    type: 'application/json'
  });
  formData.append('userData', userDataBlob, 'userData.json');

  try {
    await axios.post<RegisterUserResponse>(
        AuthMapper.register,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data', // Include this as in your working example
            // Add Authorization header if needed for your registration endpoint
          }
        }
    );

    return {
      success: true,
      message: 'Registration successful!'
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error('Error response:', axiosError.response?.data);

      const errData = axiosError.response?.data || { message: axiosError.message };

      // Better error handling with more specific messages
      if (axiosError.response?.status === 400) {
        return {
          success: false,
          message: typeof errData.message === 'string' ? errData.message : 'Invalid registration data'
        };
      } else if (axiosError.response?.status === 409) {
        return {
          success: false,
          message: 'Email already in use'
        };
      }

      return {
        success: false,
        message: typeof errData.message === 'string' ? errData.message : 'Server error'
      };
    }

    return {
      success: false,
      message: 'Unknown error occurred during registration.'
    };
  }
};