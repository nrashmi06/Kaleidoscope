package com.kaleidoscope.backend.posts.routes;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class PostsRoutes {
    private static final String API_VERSION = "/api";

    // Base route for posts
    public static final String POSTS = API_VERSION + "/posts";
    // --- Endpoint for Phase 1 ---
    public static final String GENERATE_UPLOAD_SIGNATURES = POSTS + "/generate-upload-signatures";
    // --- Endpoint for Phase 2 ---
    public static final String CREATE_POST = POSTS; //
    public static final String UPDATE_POST = POSTS + "/{postId}";
    public static final String DELETE_POST = POSTS + "/{postId}";
    public static final String HARD_DELETE_POST = POSTS + "/{postId}/hard";
    public static final String GET_POST_BY_ID = POSTS + "/{postId}";
    public static final String FILTER_POSTS = POSTS;
    // --- Post Suggestions ---
    public static final String SUGGESTIONS = POSTS + "/suggestions";
}