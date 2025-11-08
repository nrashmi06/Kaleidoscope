import axios from "axios";
import { UserTagMapper } from "@/mapper/usertagMapper";
import type { DeleteUserTagResponse } from "@/lib/types/usertag";

export const deleteUserTag = async (
  accessToken: string,
  tagId: number
): Promise<DeleteUserTagResponse> => {
  try {
    const res = await axios.delete<DeleteUserTagResponse>(
      UserTagMapper.deleteTag(tagId),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return res.data;
  } catch (err) {
    const message = axios.isAxiosError(err) ? err.message : String(err);
    console.error("[deleteUserTag] error", message);
    return {
      success: false,
      message: message || "Failed to delete tag",
      data: null,
      errors: [message || "Unknown error"],
      timestamp: Date.now(),
      path: `/api/users/tags/${tagId}`,
    };
  }
};

export default deleteUserTag;
