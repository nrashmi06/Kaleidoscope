import { PostMapper } from '@/mapper/postMapper';

export const deletePostService = async (
  accessToken: string,
  postId: number,
  hardDelete: boolean = false
): Promise<{ success: boolean; error?: string }> => {
  try {
    const url = hardDelete 
      ? PostMapper.hardDeletePost(postId) 
      : PostMapper.deletePost(postId);
    
    console.log('🗑️ Deleting post:', url);
    
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('🗑️ Delete response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('🗑️ Delete API Error Response:', errorData);
      return {
        success: false,
        error: errorData.message || "Failed to delete post",
      };
    }

    console.log('✅ Post deleted successfully');
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('🗑️ Network error deleting post:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
    };
  }
};
