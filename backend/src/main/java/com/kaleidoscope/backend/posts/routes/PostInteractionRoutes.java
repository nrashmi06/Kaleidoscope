package com.kaleidoscope.backend.posts.routes;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class PostInteractionRoutes {
    public static final String REACT_TO_POST = PostsRoutes.POSTS + "/{postId}/reactions";
    public static final String SAVE_POST = PostsRoutes.POSTS + "/{postId}/saves";
    public static final String SAVED_POSTS = PostsRoutes.POSTS + "/saved";

    // Comments
    public static final String COMMENTS = PostsRoutes.POSTS + "/{postId}/comments";
    public static final String COMMENT_BY_ID = COMMENTS + "/{commentId}";
    public static final String REACT_TO_COMMENT = COMMENT_BY_ID + "/reactions";
}
