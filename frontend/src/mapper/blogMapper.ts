const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api`;

export const BLOG_ENDPOINTS = {
  CREATE: `${BASE_URL}/blogs`,
} as const;