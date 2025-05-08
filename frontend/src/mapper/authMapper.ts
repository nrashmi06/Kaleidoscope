// Base URL coming from environment variable
const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/kaleidoscope/api`;

// AuthMapper now includes dynamic endpoint paths
export const AuthMapper = {
  register: `${BASE_URL}/auth/register`, // Dynamically built URL for registration
};
