// src/mappers/userBlocksMapper.ts

const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/kaleidoscope/api`;

export const UserBlocksMapper = {
  // ✅ This is the new endpoint
  blockUser: `${BASE_URL}/user-blocks/block`,
};