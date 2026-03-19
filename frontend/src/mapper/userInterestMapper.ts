const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api`;

export const UserInterestMapper = {
  getUserInterests: `${BASE_URL}/users/interests`,
  addUserInterest: `${BASE_URL}/users/interests`,
  removeUserInterest: (categoryId: number) => `${BASE_URL}/users/interests/${categoryId}`,
  addUserInterestsBulk: `${BASE_URL}/users/interests/bulk`,
  removeUserInterestsBulk: `${BASE_URL}/users/interests/bulk`,
  getUserInterestsByUserId: (userId: number) => `${BASE_URL}/users/interests/user/${userId}`,
};
