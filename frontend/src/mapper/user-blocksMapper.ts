const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/kaleidoscope/api`;

export const UserBlocksMapper = {
  blockUser: `${BASE_URL}/user-blocks/block`, // Block a user
  checkBlockStatus: (targetUserId: string) => `${BASE_URL}/user-blocks/status?targetUserId=${targetUserId}`, // Check if a user is blocked
  getBlockedUsers: (page: number, size: number) => `${BASE_URL}/user-blocks/blocked?page=${page}&size=${size}`, // Get all blocked users for the current user
  getUsersWhoBlockedMe: (page: number, size: number) => `${BASE_URL}/user-blocks/blocked-by?page=${page}&size=${size}`, // Get users who blocked the current user
  unBlockUser: `${BASE_URL}/user-blocks/unblock`,
  getAllBlockedUsersAdmin: (page: number, size: number) => `${BASE_URL}/user-blocks/admin/all?page=${page}&size=${size}`,
  removeBlockByIdAdmin: (id: string) => `${BASE_URL}/user-blocks/admin/remove?blockId=${id}`,
};
