
const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api`;

export const UserMapper = {
    updateUserProfileDetails: `${BASE_URL}/users/profile`,
    updateUserProfileStatusAdmin: `${BASE_URL}/users/profile-status`,
    getAllUsersByProfileStatus: (search: string, status: string, page: number, size: number) => `${BASE_URL}/users?search=${search}&status=${status}&page=${page}&size=${size}`,
    getAllFollowing:(userId : string) => `${BASE_URL}/follows/following?userId=${userId}`,
    getAllFollowers:(userId : string) => `${BASE_URL}/follows/followers?userId=${userId}`,
    followOrUnfollowUser:(targetUserId : string) => `${BASE_URL}/follows?targetUserId=${targetUserId}`,
    getUserProfile: (userId: number) => `${BASE_URL}/users/profile/${userId}`,
};