// API Configuration
export const API_CONFIG = {
  BASE_URL: `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/kaleidoscope`,
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      register: "/api/auth/register",
      login: "/api/auth/login",
      verifyEmail: "/api/auth/verify-email",
      forgotPassword: "/api/auth/forgot-password",
      resetPassword: "/api/auth/reset-password",
      logout: "/api/auth/logout",
      renewToken: "/api/auth/renew-token",
      changePassword: "/api/auth/change-password",
    },
    
    // Post endpoints
    POSTS: {
      create: "/api/posts",
      generateUploadSignatures: "/api/posts/generate-upload-signatures",
      updatePost: (postId: number) => `/api/posts/${postId}`,
      deletePost: (postId: number) => `/api/posts/${postId}`,
      hardDeletePost: (postId: number) => `/api/posts/${postId}/hard`,
      getPostById: (postId: number) => `/api/posts/${postId}`,
      filterPosts: "/api/posts",
    },
    
    // Location endpoints
    LOCATIONS: {
      search: "/api/locations/search",
      create: "/api/locations",
    },
    
    // User endpoints  
    USERS: {
      getAll: "/api/users",
      search: "/api/users/search",
    },
    
    // Category endpoints
    CATEGORIES: {
      getAll: "/api/categories",
      getCategoryById: (id: number) => `/api/categories/${id}`,
      create: "/api/categories",
      update: (id: number) => `/api/categories/${id}`,
      delete: (id: number) => `/api/categories/${id}`,
    }
  }
};

// Cloudinary Configuration
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  API_KEY: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
};
