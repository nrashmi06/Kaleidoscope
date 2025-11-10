import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   images: {
    domains: ['res.cloudinary.com',
      'res-console.cloudinary.com',
    ], // <-- Add this
  },
  /* config options here */
};

export default nextConfig;
