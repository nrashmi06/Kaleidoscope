import axios from 'axios';
import { PostCreateRequestDTO, CreatePostResponse } from '@/lib/types/post';
import { PostMapper } from '@/mapper/postMapper';

export const createPost = async (
  input: PostCreateRequestDTO,
  accessToken: string
): Promise<CreatePostResponse> => {
  const response = await axios.post<CreatePostResponse>(
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
