// /services/auth/verifyEmail.ts

import axios, { AxiosError } from 'axios';
import { AuthMapper } from '@/mapper/authMapper';
import { VerifyEmailRequest, VerifyEmailResponse, ErrorResponse } from '@/lib/types/auth';

export const verifyEmail = async (
  data: VerifyEmailRequest
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.post<VerifyEmailResponse>(AuthMapper.verifyEmail, data);
    return { success: true, message: response.data.message };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ErrorResponse>;
      const msg = axiosError.response?.data?.message;
      return {
        success: false,
        message: typeof msg === 'string' ? msg : 'Email verification failed',
      };
    }
    return { success: false, message: 'Unexpected error during email verification' };
  }
};
