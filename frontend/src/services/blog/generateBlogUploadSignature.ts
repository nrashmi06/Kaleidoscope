import { axiosInstance } from '@/hooks/axios';
import { BLOG_ENDPOINTS } from '@/mapper/blogMapper';
import { UploadSignaturesResponse } from '@/lib/types/post'; 

export interface GenerateBlogSignatureRequest {
  fileNames: string[];
}

export const generateBlogUploadSignature = async (
  input: GenerateBlogSignatureRequest,
  accessToken: string
): Promise<UploadSignaturesResponse> => {
  const response = await axiosInstance.post<UploadSignaturesResponse>(
    BLOG_ENDPOINTS.GENERATE_SIGNATURE,
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