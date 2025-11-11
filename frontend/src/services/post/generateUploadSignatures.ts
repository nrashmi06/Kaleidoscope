import { axiosInstance } from '@/hooks/axios';
import { GenerateUploadSignatureRequestDTO, UploadSignaturesResponse } from '@/lib/types/post';
import { PostMapper } from '@/mapper/postMapper';

export const generateUploadSignatures = async (
  input: GenerateUploadSignatureRequestDTO,
  accessToken: string
): Promise<UploadSignaturesResponse> => {
  const response = await axiosInstance.post<UploadSignaturesResponse>(
    PostMapper.generateUploadSignatures,
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
