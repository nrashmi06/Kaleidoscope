import axios from 'axios';
import { UsersResponse } from '@/lib/types/post';
import { PostMapper } from '@/mapper/postMapper';

export const searchUsers = async (
  accessToken: string,
  query: string,
  page: number = 0,
  size: number = 20
): Promise<UsersResponse> => {
  const response = await axios.get<UsersResponse>(
    `${PostMapper.searchUsers}?q=${encodeURIComponent(query)}&page=${page}&size=${size}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data;
};
