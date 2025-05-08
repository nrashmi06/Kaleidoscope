// User registration data structure
export interface RegisterUserData {
  email: string;
  password: string;
  username: string;
  designation: string;
  summary: string;
}

// Interface for the form state, including the file for profile picture
export interface RegisterFormState extends RegisterUserData {
  confirmPassword: string;
  profilePicture: File | null;
}


// Expected success response from backend (customize if needed)
export interface RegisterUserResponse {
  message: string;
  success: boolean;
  userId?: string;
  token?: string;
}

// Error response format (optional, based on how your backend handles errors)
export interface ErrorResponse {
  message: string;
  status?: number;
}

export interface VerifyEmailRequest {
  email: string;
}

export interface VerifyEmailResponse {
  message: string;
}

// /lib/types/auth.ts

export interface LoginUserData {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  accessToken: string;
  userId: string;
  username: string;
  email: string;
  role: string;
}

export interface ForgotPasswordData{
  email: string;
}
export interface ForgotPasswordResponse {
  message: string;
  success: boolean;
}

export interface ResetPasswordData {
  token : string;
  newpassword: string;
};

export interface ResetPasswordResponse {
  message: string;
  success: boolean;
};
