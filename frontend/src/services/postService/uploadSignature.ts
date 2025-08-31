import { PostMapper } from "@/mapper/postMapper";

export interface UploadSignatureRequest {
  fileNames: string[];
}

export interface UploadSignatureResponse {
  [fileName: string]: {
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
    folder: string;
    publicId: string;
    uploadUrl: string;
  };
}

export const generateUploadSignatureService = async (
  accessToken: string,
  data: UploadSignatureRequest
): Promise<{ success: boolean; data?: UploadSignatureResponse; error?: string }> => {
  try {
    const response = await fetch(PostMapper.generateUploadSignatures, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Failed to generate upload signature",
      };
    }

    const responseData = await response.json();
    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
    };
  }
};
