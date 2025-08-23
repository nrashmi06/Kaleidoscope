import axios, { AxiosError } from 'axios';
import { AuthMapper } from '@/mapper/authMapper';
import {
  VerifyEmailRequest,
  VerifyEmailResponse,
} from '@/lib/types/auth';

export const verifyEmail = async (
  data: VerifyEmailRequest
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.post<VerifyEmailResponse>(AuthMapper.verifyEmail, data);

    return {
      success: response.data.success,
      message: response.data.message
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<VerifyEmailResponse>;
      const errData = axiosError.response?.data;

      return {
        success: false,
        message: errData?.message || 'Email verification failed'
      };
    }

    return {
      success: false,
      message: 'Unexpected error during email verification'
    };
  }
};
