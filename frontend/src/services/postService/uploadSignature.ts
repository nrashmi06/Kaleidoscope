import { PostMapper } from "@/mapper/postMapper";

export interface UploadSignatureRequest {
  fileNames: string[];
}

export interface UploadSignatureResponse {
  success: boolean;
  message: string;
  data: {
    signatures: Array<{
      signature: string;
      timestamp: number;
      publicId: string;
      folder: string;
      apiKey: string;
      cloudName: string;
    }>;
  };
  errors: any;
  timestamp: number;
  path: any;
}

export const generateUploadSignatureService = async (
  accessToken: string,
  data: UploadSignatureRequest
): Promise<{ success: boolean; data?: UploadSignatureResponse; error?: string }> => {
  try {
    console.log('Sending request to:', PostMapper.generateUploadSignatures);
    console.log('Request body:', JSON.stringify(data));
    
    const response = await fetch(PostMapper.generateUploadSignatures, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error Response:', errorData);
      return {
        success: false,
        error: errorData.message || "Failed to generate upload signature",
      };
    }

    const responseData = await response.json();
    console.log('Raw API Response:', responseData);
    
    // Check if the backend response indicates success
    if (!responseData.success) {
      return {
        success: false,
        error: responseData.message || "Backend returned unsuccessful response",
      };
    }
    
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
