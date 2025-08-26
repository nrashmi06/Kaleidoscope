package com.kaleidoscope.backend.posts.routes;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class PostsRoutes {
    private static final String API_VERSION = "/api"; // Using v1 for clarity

    // Base route for posts
    public static final String POSTS = API_VERSION + "/posts";

    // --- Endpoint for Phase 1 ---
    /**
     * POST /api/v1/posts/generate-upload-signatures
     * Endpoint to request signatures for client-side media uploads.
     */
    public static final String GENERATE_UPLOAD_SIGNATURES = POSTS + "/generate-upload-signatures";

    // --- Endpoint for Phase 2 ---
    /**
     * POST /api/v1/posts
     * Endpoint to create the actual post after media has been uploaded.
     */
    public static final String CREATE_POST = POSTS; //

    // --- Endpoint for Phase 3 ---
    /**
     * PUT /api/v1/posts/{postId}
     * Endpoint to update an existing post.
     */
    public static final String UPDATE_POST = POSTS + "/{postId}";

    // --- Delete (soft) ---
    /**
     * DELETE /api/posts/{postId}
     * Soft delete a post by owner or admin.
     */
    public static final String DELETE_POST = POSTS + "/{postId}";

    // --- Admin hard delete ---
    /**
     * DELETE /api/posts/{postId}/hard
     * Permanently delete a post and associated media (admin only).
     */
    public static final String HARD_DELETE_POST = POSTS + "/{postId}/hard";

    // --- Get by id ---
    public static final String GET_POST_BY_ID = POSTS + "/{postId}";

    // --- Filtered listing ---
    public static final String FILTER_POSTS = POSTS;
}