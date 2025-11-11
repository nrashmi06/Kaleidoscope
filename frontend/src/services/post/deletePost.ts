import { PostMapper } from '@/mapper/postMapper';
import type { PostSoftDeleteResponse } from '@/lib/types/post';
// ✅ 1. Import axios instance and error types
import { axiosInstance, isAxiosError, AxiosError } from "@/hooks/axios";

/**
 * Calls the soft-delete endpoint for a post.
 * This always targets the soft-delete route: DELETE /posts/{postId}
 */
export const deletePostService = async (
  accessToken: string,
  postId: number
): Promise<PostSoftDeleteResponse> => {
  const url = PostMapper.deletePost(postId);
  
  // Normalize token: strip leading 'Bearer ' if present
  // This logic is kept from the original in case the interceptor doesn't handle it
  const rawToken = accessToken ? accessToken.replace(/^Bearer\s+/i, '') : '';

  try {
    if (process.env.NODE_ENV === 'development') {
      // Mask token for logs (show only last 8 chars)
      const masked = rawToken ? `***${rawToken.slice(-8)}` : '<no-token>';
      console.debug('[deletePostService] Deleting post:', url, 'using token ending', masked);
    }

    // ✅ 2. Call axiosInstance.delete
    const response = await axiosInstance.delete<PostSoftDeleteResponse>(url, {
      headers: {
        // Pass the raw token; the interceptor should add "Bearer "
        // If the interceptor *doesn't* add it, this header will.
        ...(rawToken ? { Authorization: `Bearer ${rawToken}` } : {}),
        'Content-Type': 'application/json',
      },
    });

    // ✅ 3. On success (2xx), return the response data directly
    // Assuming the backend 'success' flag is true on a 2xx response
    return response.data;

  } catch (error) {
    // ✅ 4. Handle errors
    if (isAxiosError(error)) {
      // This is an AxiosError (e.g., 404, 500, 401)
      const axiosError = error as AxiosError<PostSoftDeleteResponse>;
      const responseData = axiosError.response?.data;

      console.error('[deletePostService] API error:', axiosError.response?.status, responseData);
      
      // ✅ 5. Normalize the API error to PostSoftDeleteResponse shape
      // This replicates the original 'fetch' logic for non-ok responses
      return {
        success: false,
        message: responseData?.message || 'Failed to delete post',
        data: responseData?.data || null,
        errors: responseData?.errors || [],
        timestamp: responseData?.timestamp || Date.now(),
        path: responseData?.path || url,
      };
    }

    // ✅ 6. This is a network or other non-Axios error
    console.error('[deletePostService] Network error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error',
      data: null,
      errors: [error instanceof Error ? error.message : 'Network error'],
      timestamp: Date.now(),
      path: url, // Use the generated URL
    };
  }
};