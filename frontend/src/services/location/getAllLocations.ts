import { axiosInstance } from '@/hooks/axios';
import { LocationsResponse } from '@/lib/types/post';
import { PostMapper } from '@/mapper/postMapper';

export const searchLocations = async (
  accessToken: string,
  query: string = '',
  page: number = 0,
  size: number = 20
): Promise<LocationsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sort: 'name',
  });

  if (query.trim()) {
    params.append('search', query);
  }

  const response = await axiosInstance.get<LocationsResponse>(
    `${PostMapper.searchLocations}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data;
};
