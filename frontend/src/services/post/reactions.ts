// Define the expected response structure from the API
export interface ReactToPostResponse {
  success: boolean;
  message: string;
  data?: any;
  errors: any[];
}

/**
 * Sends a request to the backend to add or update a reaction on a post.
 */
export const likePostService = async (
  postId: number,
  accessToken: string
): Promise<{ success: boolean; data?: ReactToPostResponse; error?: string }> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/kaleidoscope/api/posts/${postId}/reactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        reactionType: "LIKE" // Hardcoding LIKE as per the social card's functionality
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Failed to like post",
      };
    }

    const data: ReactToPostResponse = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};

/**
 * Sends a request to the backend to unlike (remove a reaction from) a post.
 */
export const unlikePostService = async (
  postId: number,
  accessToken: string
): Promise<{ success: boolean; data?: ReactToPostResponse; error?: string }> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/kaleidoscope/api/posts/${postId}/reactions?unreact=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Important for CORS preflight consistency
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}), // Sending an empty JSON body ensures CORS preflight works correctly
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Failed to unlike post",
      };
    }

    const data: ReactToPostResponse = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};
