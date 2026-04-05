import axiosInstance, { isAxiosError, AxiosError } from "@/hooks/axios";
import { UserBlocksMapper } from "@/mapper/user-blocksMapper";

interface AdminBlockEntry {
  blockId: number;
  blocker: {
    userId: number;
    username: string;
    email: string;
    profilePictureUrl: string | null;
  };
  blocked: {
    userId: number;
    username: string;
    email: string;
    profilePictureUrl: string | null;
  };
  reason: string;
  createdAt: string;
}

interface AdminBlocksPage {
  content: AdminBlockEntry[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

interface AdminBlocksApiResponse {
  success: boolean;
  message: string;
  data: AdminBlocksPage | null;
  errors: string[];
  timestamp: number;
  path: string;
}

export type { AdminBlockEntry, AdminBlocksPage, AdminBlocksApiResponse };

export const getAllBlockedUsersAdmin = async (
  page: number,
  size: number,
  accessToken: string
): Promise<AdminBlocksApiResponse> => {
  const url = UserBlocksMapper.getAllBlockedUsersAdmin(page, size);

  try {
    const response = await axiosInstance.get<AdminBlocksApiResponse>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<AdminBlocksApiResponse>;
      if (axiosError.response?.data) return axiosError.response.data;
    }

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
      data: null,
      errors: [error instanceof Error ? error.message : "Unknown error"],
      timestamp: Date.now(),
      path: url,
    };
  }
};
