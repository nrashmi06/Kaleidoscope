export interface ReactToPostResponse {
  success: boolean;
  message: string;
  data?: any;
  errors: any[];
}

export const likePostService = async (
  postId: number,
  accessToken: string
): Promise<{ success: boolean; data?: ReactToPostResponse; error?: string }> => {
  try {
    console.log(`[ReactionsService] Liking post ${postId}`);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/posts/${postId}/reactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        reactionType: "LIKE"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ReactionsService] Failed to like post: ${response.status} ${errorText}`);
      return {
        success: false,
        error: `Failed to like post: ${response.status} ${response.statusText}`,
      };
    }

    const data: ReactToPostResponse = await response.json();
    console.log(`[ReactionsService] Post liked successfully:`, data);
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(`[ReactionsService] Error liking post:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};

export const unlikePostService = async (
  postId: number,
  accessToken: string
): Promise<{ success: boolean; data?: ReactToPostResponse; error?: string }> => {
  try {
    console.log(`[ReactionsService] Unliking post ${postId}`);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api/posts/${postId}/reactions?unreact=false`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        reactionType: "LIKE"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ReactionsService] Failed to unlike post: ${response.status} ${errorText}`);
      return {
        success: false,
        error: `Failed to unlike post: ${response.status} ${response.statusText}`,
      };
    }

    const data: ReactToPostResponse = await response.json();
    console.log(`[ReactionsService] Post unliked successfully:`, data);
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error(`[ReactionsService] Error unliking post:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};
