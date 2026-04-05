import axiosInstance, { isAxiosError, AxiosError } from "@/hooks/axios";
import { UserTagMapper } from "@/mapper/usertagMapper";

interface StandardResponse {
  success: boolean;
  message: string;
  data: unknown;
  errors: string[];
  timestamp: number;
  path: string;
}

/**
 * Fetches tags for a specific content item.
 * Endpoint: GET /api/content/{contentType}/{contentId}/tags
 *
 * @param contentType - The type of content (e.g., POST, BLOG, COMMENT)
 * @param contentId - The ID of the content
 * @param accessToken - Bearer token for authentication
 * @returns A StandardResponse containing the tags for the content
 */
export const getContentTagsService = async (
  contentType: string,
  contentId: number,
  accessToken: string
): Promise<StandardResponse> => {
  const url = UserTagMapper.getTagsForContent(contentType, contentId);

  try {
    const response = await axiosInstance.get<StandardResponse>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error: unknown) {
    console.error("[getContentTagsService] Error:", error);

    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<StandardResponse>;
      if (axiosError.response?.data) return axiosError.response.data;
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      data: null,
      errors: [error instanceof Error ? error.message : "Unknown error"],
      timestamp: Date.now(),
      path: url,
    };
  }
};

export default getContentTagsService;
