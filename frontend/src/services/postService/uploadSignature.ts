import axios, { AxiosError } from "axios";
import { PostMapper } from "@/mapper/postMapper";
import axiosInstance from "@/hooks/axios";

/* -------------------------------------------------------------------------- */
/*                               Type Definitions                             */
/* -------------------------------------------------------------------------- */

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
  errors: unknown[];
  timestamp: number;
}

/** Shape of backend error response for safe Axios narrowing */
interface ApiErrorResponse {
  message?: string;
  status?: number;
  timestamp?: string | number;
  path?: string;
  errors?: unknown[];
}

/** Uniform service return structure */
interface UploadSignatureResult {
  success: boolean;
  data?: UploadSignatureResponse;
  error?: string;
}

/* -------------------------------------------------------------------------- */
/*                              Axios API Service                             */
/* -------------------------------------------------------------------------- */

export const generateUploadSignatureService = async (
  accessToken: string,
  payload: UploadSignatureRequest
): Promise<UploadSignatureResult> => {
  try {
    console.log("📤 [generateUploadSignatureService] Sending request to:", PostMapper.generateUploadSignatures);
    console.log("🧾 Request body:", JSON.stringify(payload));

    const response = await axiosInstance.post<UploadSignatureResponse>(
      PostMapper.generateUploadSignatures,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📥 [generateUploadSignatureService] Response received:", response.data);

    // ✅ Ensure backend reported success
    if (!response.data.success) {
      return {
        success: false,
        error: response.data.message || "Backend returned unsuccessful response",
      };
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error: unknown) {
    console.error("❌ [generateUploadSignatureService] Error:", error);

    // ✅ Safe Axios error narrowing
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message =
        axiosError.response?.data?.message ??
        axiosError.message ??
        "Unknown API error";

      return {
        success: false,
        error: message,
      };
    }

    // ✅ Handle unexpected (non-Axios) errors
    const fallbackMessage =
      error instanceof Error ? error.message : "Unexpected network error";

    return {
      success: false,
      error: fallbackMessage,
    };
  }
};
