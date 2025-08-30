package com.kaleidoscope.backend.shared.routes;

public class UserTagRoutes {
    public static final String BASE_PATH = "/api/users";
    
    // User tagging endpoints
    public static final String TAGGABLE_USERS = BASE_PATH + "/taggable-users";
    public static final String CREATE_TAG = BASE_PATH + "/tags";
    public static final String DELETE_TAG = BASE_PATH + "/tags/{tagId}";
    public static final String CONTENT_TAGS = "/api/content/{contentType}/{contentId}/tags";
    public static final String USER_TAGGED_CONTENT = BASE_PATH + "/{userId}/tagged-content";
}
