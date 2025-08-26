package com.kaleidoscope.backend.posts.routes;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class PostInteractionRoutes {
    public static final String REACT_TO_POST = PostsRoutes.POSTS + "/{postId}/reactions";
}


