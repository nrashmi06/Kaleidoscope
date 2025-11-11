// src/mappers/userBlocksMapper.ts


const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/kaleidoscope/api`;

export const UserBlocksMapper = {
  // POST /api/user-blocks/block
  blockUser: `${BASE_URL}/user-blocks/block`,

  // GET /api/user-blocks/status
  checkBlockStatus: (targetUserId: number) =>
    `${BASE_URL}/user-blocks/status?targetUserId=${targetUserId}`,

  // ✅ GET /api/user-blocks/blocked (This is the new endpoint)
  getBlockedUsers: (page: number, size: number, sort: string = "createdAt,desc") => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: sort,
    });
    return `${BASE_URL}/user-blocks/blocked?${params.toString()}`;
  },

  getUsersBlockedBy: (page: number, size: number, sort: string = "createdAt,desc") => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: sort,
    });
    return `${BASE_URL}/user-blocks/blocked-by?${params.toString()}`;
  },

  // ✅ DELETE /api/user-blocks/unblock (This is the required endpoint)
  unBlockUser: `${BASE_URL}/user-blocks/unblock`,

};