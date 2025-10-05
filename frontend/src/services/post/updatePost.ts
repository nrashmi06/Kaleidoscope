import axios from 'axios';
import { PostCreateRequestDTO, StandardAPIResponse } from '@/lib/types/post';
import { PostMapper } from '@/mapper/postMapper';

export const updatePost = async (
  postId: number,
  input: PostCreateRequestDTO,
  accessToken: string
): Promise<StandardAPIResponse<any>> => {
  const response = await axios.put<StandardAPIResponse<any>>(
    PostMapper.updatePost(postId),
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
