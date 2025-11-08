import type { CreateUserTagPayload } from "@/services/userTag/createUserTag";
import createUserTag from "@/services/userTag/createUserTag";

export const createUserTagController = async (
  accessToken: string,
  payload: CreateUserTagPayload
) => {
  try {
    const res = await createUserTag(accessToken, payload);
    return res;
  } catch (err) {
    console.error("[createUserTagController]", err);
    return {
      success: false,
      message: "Failed to create user tag",
      data: null,
      errors: [String(err)],
      timestamp: Date.now(),
      path: "/api/users/tags",
    };
  }
};

export default createUserTagController;
