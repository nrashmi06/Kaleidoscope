const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/kaleidoscope/api`;

export const FollowMapper = {
  follow: (targetUserId: number) => `${BASE_URL}/follows?targetUserId=${targetUserId}`,
  unfollow: (targetUserId: number) => `${BASE_URL}/follows?targetUserId=${targetUserId}`,
  suggestions: () => `${BASE_URL}/follows/suggestions`,
  following: () => `${BASE_URL}/follows/following`,
  followers: () => `${BASE_URL}/follows/followers`,
  pendingRequests: () => `${BASE_URL}/follows/requests/pending`,
  approveRequest: () => `${BASE_URL}/follows/requests/approve`,
  rejectRequest: () => `${BASE_URL}/follows/requests/reject`,
} as const;

export default FollowMapper;
