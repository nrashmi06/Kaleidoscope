// /mapper/authMapper.ts

const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/kaleidoscope/api`;

export const AuthMapper = {
  register: `${BASE_URL}/auth/register`,
  login: `${BASE_URL}/auth/login`,
  verifyEmail: `${BASE_URL}/auth/verify-email`, 
};
