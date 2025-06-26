package com.kaleidoscope.backend.users.routes;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class FollowRoutes {
    public static final String BASE = "/api/follows";
    public static final String FOLLOW = BASE;
    public static final String FOLLOWERS = BASE + "/followers";
    public static final String FOLLOWING = BASE + "/following";
}
