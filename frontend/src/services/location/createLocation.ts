import { axiosInstance } from '@/hooks/axios';
import { CreateLocationRequestDTO, CreateLocationResponse } from '@/lib/types/post';
import { PostMapper } from '@/mapper/postMapper';

export const createLocation = async (
  input: CreateLocationRequestDTO,
  accessToken: string
): Promise<CreateLocationResponse> => {
  const response = await axiosInstance.post<CreateLocationResponse>(
    PostMapper.createLocation,
    input,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};
