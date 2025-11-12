import { axiosInstance } from '@/hooks/axios';
import { PostCreateRequestDTO, CreatePostResponse } from '@/lib/types/post';
import { PostMapper } from '@/mapper/postMapper';

export const createPost = async (
  input: PostCreateRequestDTO,
  accessToken: string
): Promise<CreatePostResponse> => {
  const response = await axiosInstance.post<CreatePostResponse>(
    PostMapper.createPost,
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
