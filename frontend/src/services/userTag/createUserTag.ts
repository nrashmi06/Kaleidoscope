import axios from "axios";
import { UserTagMapper } from "@/mapper/usertagMapper";
import type { StandardAPIResponse } from "@/lib/types/usertag";
import axiosInstance from "@/hooks/axios";

export interface CreateUserTagPayload {
  taggedUserId: number;
  contentType: "POST" | "COMMENT" | string;
  contentId: number;
}

export const createUserTag = async (
  accessToken: string,
  payload: CreateUserTagPayload
): Promise<StandardAPIResponse<Record<string, unknown>>> => {
  try {
    const res = await axiosInstance.post<StandardAPIResponse<Record<string, unknown>>>(UserTagMapper.createTag(), payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.data;
  } catch (err) {
    const message = axios.isAxiosError(err) ? err.message : String(err);
    console.error("[createUserTag] error", message);
    return {
      success: false,
      message: message || "Failed to create tag",
      data: null,
      errors: [message || "Unknown error"],
      timestamp: Date.now(),
      path: "/api/users/tags",
    };
  }
};

export default createUserTag;
