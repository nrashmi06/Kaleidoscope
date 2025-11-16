package com.kaleidoscope.backend.blogs.routes;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class BlogInteractionRoutes {
    public static final String REACT_TO_BLOG = BlogsRoutes.BLOGS + "/{blogId}/reactions";
    public static final String SAVE_BLOG = BlogsRoutes.BLOGS + "/{blogId}/saves";
    public static final String SAVED_BLOGS = BlogsRoutes.BLOGS + "/saved";

    // Comments
    public static final String COMMENTS = BlogsRoutes.BLOGS + "/{blogId}/comments";
    public static final String COMMENT_BY_ID = COMMENTS + "/{commentId}";
    public static final String REACT_TO_COMMENT = COMMENT_BY_ID + "/reactions";
}

