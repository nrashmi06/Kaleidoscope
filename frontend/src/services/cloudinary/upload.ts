export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  bytes: number;
  duration?: number;
  format: string;
  resource_type: "image" | "video" | "raw" | "auto";
}

export const uploadToCloudinary = async (
  file: File,
  cloudName: string,
  signature: string,
  timestamp: number,
  apiKey: string,
  folder: string,
  publicId: string
): Promise<{ success: boolean; data?: CloudinaryUploadResult; error?: string }> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("signature", signature);
    formData.append("timestamp", timestamp.toString());
    formData.append("api_key", apiKey);
    formData.append("folder", folder);
    formData.append("public_id", publicId);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: responseData.error?.message || "Upload failed",
      };
    }

    return {
      success: true,
      data: responseData as CloudinaryUploadResult,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload error occurred",
    };
  }
};
