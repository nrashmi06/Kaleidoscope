

export interface StandardAPIResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
  timestamp: number;
  path: string;
}


export interface ForgotPasswordData {
  email: string;
}

export interface LoginUserData {
  email: string;
  password: string;
}

export interface RegisterUserData {
  email: string;
  password: string;
  username: string;
  designation: string;
  summary: string;
}

export interface RegisterFormState extends RegisterUserData {
  confirmPassword: string; // Frontend-only
  profilePicture: File | null;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  email: string;
}

// =======================
// ✅ Response Payloads (used in `data` field of StandardAPIResponse)
// =======================

export interface ForgotPasswordPayload {
  message: string;
}

export interface LoginUserPayload {
  accessToken: string;
  userId: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN'; // Extend roles as needed
}

export interface RegisterUserPayload {
  userId: string;
  token: string;
}

export interface ResetPasswordPayload {
  message: string;
}

export interface VerifyEmailResponsePayload {
  message: string;
}


export type ForgotPasswordResponse = StandardAPIResponse<ForgotPasswordPayload>;
export type LoginUserResponse = StandardAPIResponse<LoginUserPayload>;
export type RegisterUserResponse = StandardAPIResponse<RegisterUserPayload>;
export type ResetPasswordResponse = StandardAPIResponse<ResetPasswordPayload>;
export type VerifyEmailResponse = StandardAPIResponse<VerifyEmailResponsePayload>;
export type RefreshTokenResponse = StandardAPIResponse<LoginUserPayload>;
