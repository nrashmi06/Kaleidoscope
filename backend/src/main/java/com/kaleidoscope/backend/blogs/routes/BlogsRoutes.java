package com.kaleidoscope.backend.blogs.routes;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class BlogsRoutes {
    private static final String API_VERSION = "/api";

    // Base route for blogs
    public static final String BLOGS = API_VERSION + "/blogs";
    
    // --- Endpoint for Phase 1 ---
    public static final String GENERATE_UPLOAD_SIGNATURES = BLOGS + "/generate-upload-signatures";
    
    // --- Endpoint for Phase 2 ---
    public static final String CREATE_BLOG = BLOGS;
    public static final String UPDATE_BLOG = BLOGS + "/{blogId}";
    public static final String DELETE_BLOG = BLOGS + "/{blogId}";
    public static final String HARD_DELETE_BLOG = BLOGS + "/{blogId}/hard";
    public static final String GET_BLOG_BY_ID = BLOGS + "/{blogId}";
    public static final String FILTER_BLOGS = BLOGS + "/filter";

    // --- Admin Endpoints ---
    public static final String UPDATE_BLOG_STATUS = BLOGS + "/{blogId}/status";
}
