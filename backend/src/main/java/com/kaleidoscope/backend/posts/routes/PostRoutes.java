package com.kaleidoscope.backend.posts.routes;

public final class PostRoutes {

    private PostRoutes() {
        throw new IllegalStateException("Utility class");
    }

    private static final String BASE_API = "/api/posts";

    public static final String CREATE_POST = BASE_API;
    public static final String CLOUDINARY_WEBHOOK = BASE_API + "/webhook/cloudinary";
}
