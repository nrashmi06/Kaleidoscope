import axios, { AxiosError } from 'axios';
import {
  RegisterUserData,
  RegisterUserResponse,
  ErrorResponse
} from '@/lib/types/auth';
import { AuthMapper } from '@/mapper/authMapper';

export const registerUserWithProfile = async (
  userData: RegisterUserData,
  profilePicture: File
): Promise<{ success: boolean; message: string }> => {
  const formData = new FormData();

  // Append the image (profile picture)
  formData.append('profilePicture', profilePicture);

  // Convert userData to a Blob with application/json content type
  const userDataBlob = new Blob([JSON.stringify(userData)], {
    type: 'application/json'
  });

  // Append the Blob to the form with a name and filename
  formData.append('userData', userDataBlob, 'userData.json');

  try {
    await axios.post<RegisterUserResponse>(
      AuthMapper.register,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
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

      const errData = axiosError.response?.data  || { message: axiosError.message };

      // Better error handling with more specific messages
      if (axiosError.response?.status === 400) {
        return {
          success: false,
          message: typeof errData === 'string' ? errData : 'Invalid registration data'
        };
      } else if (axiosError.response?.status === 409) {
        return {
          success: false,
          message: 'Email already in use'
        };
      }

      return {
        success: false,
        message: typeof errData.message === 'string' ? errData.message : 'Registration failed'
      };
    }


    return {
      success: false,
      message: 'Unknown error occurred during registration.'
    };
  }
};
