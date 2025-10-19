import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   images: {
    domains: ['res.cloudinary.com'], // <-- Add this
  },
  /* config options here */
};

export default nextConfig;
