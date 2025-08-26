package com.kaleidoscope.backend.posts.routes;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class PostInteractionRoutes {
    public static final String REACT_TO_POST = PostsRoutes.POSTS + "/{postId}/reactions";

    // Comments
    public static final String COMMENTS = PostsRoutes.POSTS + "/{postId}/comments";
    public static final String COMMENT_BY_ID = COMMENTS + "/{commentId}";
}


