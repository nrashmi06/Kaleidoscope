package com.kaleidoscope.backend.shared.routes;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class HashtagRoutes {

    private static final String BASE_API = "/api/hashtags";

    public static final String TRENDING = BASE_API + "/trending";
    public static final String SUGGEST = BASE_API + "/suggest";
    public static final String DELETE_HASHTAG = BASE_API + "/{hashtagId}";
}

