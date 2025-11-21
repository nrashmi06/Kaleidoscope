import { generateBlogUploadSignature } from "@/services/blog/generateBlogUploadSignature";
import { UploadSignaturesResponse } from "@/lib/types/post";

export interface UploadSignatureRequest {
  fileNames: string[];
}

export const generateUploadSignatureController = async (
  accessToken: string,
  data : UploadSignatureRequest
): Promise<UploadSignaturesResponse> => {
  try {
    const response = await generateBlogUploadSignature(data, accessToken);
    return response;
  } catch (error) {
    console.error("Failed to generate blog upload signature", error);
    return {
      success: false,
      message: "Failed to initiate upload",
      data: null,
      errors: [String(error)],
      timestamp: Date.now(),
      path: "/api/blogs/generate-upload-signatures"
    };
  }
};