import { PostMapper } from '@/mapper/postMapper';
import type { PostSoftDeleteResponse } from '@/lib/types/post';

/**
 * Calls the soft-delete endpoint for a post.
 * This always targets the soft-delete route: DELETE /posts/{postId}
 */
export const deletePostService = async (
  accessToken: string,
  postId: number
): Promise<PostSoftDeleteResponse> => {
  try {
    const url = PostMapper.deletePost(postId);

    // Normalize token: strip leading 'Bearer ' if present
    const rawToken = accessToken ? accessToken.replace(/^Bearer\s+/i, '') : '';

    if (process.env.NODE_ENV === 'development') {
      // Mask token for logs (show only last 8 chars)
      const masked = rawToken ? `***${rawToken.slice(-8)}` : '<no-token>';
      console.debug('[deletePostService] Deleting post:', url, 'using token ending', masked);
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...(rawToken ? { Authorization: `Bearer ${rawToken}` } : {}),
        'Content-Type': 'application/json',
      },
    });

    // Attempt to parse JSON body (backend uses the standard response wrapper)
    const responseData = await response.json();

    if (!response.ok) {
      console.error('[deletePostService] API error:', response.status, responseData);
      // Normalize to PostSoftDeleteResponse shape
      return {
        success: false,
        message: responseData?.message || 'Failed to delete post',
        data: null,
        errors: responseData?.errors || [],
        timestamp: Date.now(),
        path: responseData?.path || url,
      };
    }

    return responseData as PostSoftDeleteResponse;
  } catch (error) {
    console.error('[deletePostService] Network error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error',
      data: null,
      errors: [error instanceof Error ? error.message : 'Network error'],
      timestamp: Date.now(),
      path: `/posts/${postId}`,
    };
  }
};
