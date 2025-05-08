import axios, { AxiosError } from 'axios';
import { RegisterUserData, RegisterUserResponse, ErrorResponse } from '@/lib/types/auth';
import { AuthMapper } from '@/mapper/authMapper';

export const registerUserWithProfile = async (
  userData: RegisterUserData,
  profilePicture: File | null
): Promise<{ success: boolean; message: string }> => {
  const formData = new FormData();
  
  // Append the user data first
  formData.append('userData', new Blob([JSON.stringify(userData)], {
    type: 'application/json'
  }));
  
  // Then append the profile picture if it exists
  if (profilePicture) {
    formData.append('profilePicture', profilePicture);
  }
  
  try {
    await axios.post<RegisterUserResponse>(
      AuthMapper.register,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
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
      const errData = axiosError.response?.data || { message: axiosError.message };
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