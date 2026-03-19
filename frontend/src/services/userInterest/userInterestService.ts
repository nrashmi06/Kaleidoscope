import { AxiosError } from "axios";
import axiosInstance, { isAxiosError } from "@/hooks/axios";
import { UserInterestMapper } from "@/mapper/userInterestMapper";
import {
  GetUserInterestsResponse,
  AddUserInterestResponse,
  RemoveUserInterestResponse,
  BulkUserInterestResponse,
} from "@/lib/types/userInterest";

export async function getUserInterestsService(
  accessToken: string,
  page: number = 0,
  size: number = 10
): Promise<GetUserInterestsResponse> {
  const url = UserInterestMapper.getUserInterests;

  try {
    const response = await axiosInstance.get<GetUserInterestsResponse>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { page, size },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<GetUserInterestsResponse>;
      return axiosError.response?.data || {
        success: false,
        message: "Failed to fetch user interests",
        data: null,
        errors: [axiosError.message],
        timestamp: Date.now(),
        path: url,
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error",
      data: null,
      errors: ["Unknown error"],
      timestamp: Date.now(),
      path: url,
    };
  }
}

export async function addUserInterestService(
  accessToken: string,
  categoryId: number
): Promise<AddUserInterestResponse> {
  const url = UserInterestMapper.addUserInterest;

  try {
    const response = await axiosInstance.post<AddUserInterestResponse>(
      url,
      { categoryId },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<AddUserInterestResponse>;
      return axiosError.response?.data || {
        success: false,
        message: "Failed to add user interest",
        data: null,
        errors: [axiosError.message],
        timestamp: Date.now(),
        path: url,
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error",
      data: null,
      errors: ["Unknown error"],
      timestamp: Date.now(),
      path: url,
    };
  }
}

export async function removeUserInterestService(
  accessToken: string,
  categoryId: number
): Promise<RemoveUserInterestResponse> {
  const url = UserInterestMapper.removeUserInterest(categoryId);

  try {
    const response = await axiosInstance.delete<RemoveUserInterestResponse>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<RemoveUserInterestResponse>;
      return axiosError.response?.data || {
        success: false,
        message: "Failed to remove user interest",
        data: null,
        errors: [axiosError.message],
        timestamp: Date.now(),
        path: url,
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error",
      data: null,
      errors: ["Unknown error"],
      timestamp: Date.now(),
      path: url,
    };
  }
}

export async function removeUserInterestsBulkService(
  accessToken: string,
  categoryIds: number[]
): Promise<BulkUserInterestResponse> {
  const url = UserInterestMapper.removeUserInterestsBulk;

  try {
    const response = await axiosInstance.delete<BulkUserInterestResponse>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      data: { categoryIds },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<BulkUserInterestResponse>;
      return axiosError.response?.data || {
        success: false,
        message: "Failed to remove user interests in bulk",
        data: null,
        errors: [axiosError.message],
        timestamp: Date.now(),
        path: url,
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error",
      data: null,
      errors: ["Unknown error"],
      timestamp: Date.now(),
      path: url,
    };
  }
}

export async function getUserInterestsByUserIdService(
  accessToken: string,
  userId: number,
  page: number = 0,
  size: number = 10
): Promise<GetUserInterestsResponse> {
  const url = UserInterestMapper.getUserInterestsByUserId(userId);

  try {
    const response = await axiosInstance.get<GetUserInterestsResponse>(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { page, size },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError<GetUserInterestsResponse>;
      return axiosError.response?.data || {
        success: false,
        message: `Failed to fetch interests for user ${userId}`,
        data: null,
        errors: [axiosError.message],
        timestamp: Date.now(),
        path: url,
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unexpected error",
      data: null,
      errors: ["Unknown error"],
      timestamp: Date.now(),
      path: url,
    };
  }
}
