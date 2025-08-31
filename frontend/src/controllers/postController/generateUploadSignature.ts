import { generateUploadSignatureService, UploadSignatureRequest } from "@/services/postService/uploadSignature";

export const generateUploadSignatureController = async (
  accessToken: string,
  data: UploadSignatureRequest
) => {
  return await generateUploadSignatureService(accessToken, data);
};
