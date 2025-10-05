export interface TagUserRequest {
  userIds: number[];
  postId: number;
}

export interface TagUserResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: any[];
}

export const tagUserService = async (
  request: TagUserRequest,
  accessToken: string
): Promise<{ success: boolean; data?: TagUserResponse; error?: string }> => {
  try {
    console.log(`[TagUserService] Tagging users:`, request);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/users/tags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TagUserService] Failed to tag users: ${response.status} ${errorText}`);
      
      let errorMsg = `Failed to tag users: ${response.status} ${response.statusText}`;
      
      // Handle specific error cases
      if (response.status === 400) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message && errorData.message.includes("Invalid user ID")) {
            errorMsg = "One or more user IDs are invalid. Please check the selected users.";
          } else if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMsg = errorData.errors.join(", ");
          } else {
            errorMsg = errorData.message || errorMsg;
          }
        } catch {
          errorMsg = "Invalid request. Please check the user IDs.";
        }
      } else if (response.status === 404) {
        errorMsg = "User tagging service not found.";
      } else if (response.status === 403) {
        errorMsg = "You don't have permission to tag users.";
      }
      
      return {
        success: false,
        error: errorMsg,
      };
    }

    const data: TagUserResponse = await response.json();
    console.log(`[TagUserService] Users tagged successfully:`, data);
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(`[TagUserService] Error tagging users:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred while tagging users",
    };
  }
};
