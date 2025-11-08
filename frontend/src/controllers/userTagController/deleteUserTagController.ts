import type { DeleteUserTagResponse } from "@/lib/types/usertag";
import deleteUserTag from "@/services/userTag/deleteUserTag";

export const deleteUserTagController = async (
  accessToken: string,
  tagId: number
): Promise<DeleteUserTagResponse> => {
  try {
    const res = await deleteUserTag(accessToken, tagId);
    return res;
  } catch (err) {
    console.error("[deleteUserTagController]", err);
    return {
      success: false,
      message: "Failed to delete user tag",
      data: null,
      errors: [String(err)],
      timestamp: Date.now(),
      path: `/api/users/tags/${tagId}`,
    };
  }
};

export default deleteUserTagController;
