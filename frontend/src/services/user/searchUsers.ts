
import { UsersResponse } from '@/lib/types/post';
import { PostMapper } from '@/mapper/postMapper';
import axiosInstance from '@/hooks/axios';

export const searchUsers = async (
  accessToken: string,
  query: string,
  page: number = 0,
  size: number = 20
): Promise<UsersResponse> => {
  const response = await axiosInstance.get<UsersResponse>(
    `${PostMapper.searchUsers}?search=${encodeURIComponent(query)}&page=${page}&size=${size}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data;
};
