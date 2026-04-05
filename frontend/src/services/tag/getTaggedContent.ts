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
 * Fetches content that a user has been tagged in.
 * Endpoint: GET /api/users/{userId}/tagged-content
 *
 * @param userId - The ID of the user
 * @param accessToken - Bearer token for authentication
 * @param page - Optional page number for pagination
 * @param size - Optional page size for pagination
 * @returns A StandardResponse containing the tagged content
 */
export const getTaggedContentService = async (
  userId: number,
  accessToken: string,
  page?: number,
  size?: number
): Promise<StandardResponse> => {
  const url = UserTagMapper.getTaggedContent(userId);

  try {
    const response = await axiosInstance.get<StandardResponse>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: { page, size },
    });

    return response.data;
  } catch (error: unknown) {
    console.error("[getTaggedContentService] Error:", error);

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

export default getTaggedContentService;
