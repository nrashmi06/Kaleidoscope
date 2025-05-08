// User registration data structure
export interface RegisterUserData {
  email: string;
  password: string;
  username: string;
  designation: string;
  summary: string;
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
