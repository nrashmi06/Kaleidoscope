import { axiosInstance } from "@/hooks/axios";
import { PostCreateRequestDTO, StandardAPIResponse } from "@/lib/types/post";
import { PostMapper } from "@/mapper/postMapper";

/**
 * Updates an existing post by ID.
 * Fully typed, no `any`, flexible via generics.
 *
 * @param postId - ID of the post to update
 * @param input - Post payload to send to the backend
 * @param accessToken - Bearer token for authorization
 * @returns StandardAPIResponse<T> - where T can be inferred or `null`
 */
export const updatePost = async <T = null>(
  postId: number,
  input: PostCreateRequestDTO,
  accessToken: string
): Promise<StandardAPIResponse<T>> => {
  const response = await axiosInstance.put<StandardAPIResponse<T>>(
    PostMapper.updatePost(postId),
    input,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};
