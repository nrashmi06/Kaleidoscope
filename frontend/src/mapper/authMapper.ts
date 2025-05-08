// /mapper/authMapper.ts

const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/kaleidoscope/api`;

export const AuthMapper = {
  register: `${BASE_URL}/auth/register`,
  login: `${BASE_URL}/auth/login`,
  verifyEmail: `${BASE_URL}/auth/resend-verification-email`, 
  forgotPassword: `${BASE_URL}/auth/forgot-password`,
  resetPassword: `${BASE_URL}/auth/reset-password`,
  logout: `${BASE_URL}/auth/logout`,
  renewToken : `${BASE_URL}/auth/renew-token`,
  changePassword: `${BASE_URL}/auth/change-password`,
};
