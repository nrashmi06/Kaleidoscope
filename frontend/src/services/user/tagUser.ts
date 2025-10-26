import { TagUserRequest, TagUserResponse } from "@/lib/types/post";

export const tagUserService = async (
  request: TagUserRequest,
  accessToken: string
): Promise<{ success: boolean; data?: TagUserResponse; error?: string }> => {
  try {
    console.log(`[TagUserService] Tagging user:`, request);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/users/tags`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `Failed to tag user: ${response.status} ${response.statusText}`;

      try {
        const errorData: TagUserResponse = JSON.parse(errorText);
        if (errorData.errors?.length) {
          errorMsg = errorData.errors.join(", ");
        } else if (errorData.message) {
          errorMsg = errorData.message;
        }
      } catch {
        console.error(`[TagUserService] Failed to parse error response:`, errorText);
      }

      return { success: false, error: errorMsg };
    }

    const data: TagUserResponse = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while tagging the user",
    };
  }
};
