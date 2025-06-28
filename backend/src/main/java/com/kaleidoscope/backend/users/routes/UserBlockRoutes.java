package com.kaleidoscope.backend.users.routes;

public final class UserBlockRoutes {

    private UserBlockRoutes() {
        throw new IllegalStateException("Utility class");
    }

    private static final String BASE_API = "/api/user-blocks";

    public static final String BLOCK_USER = BASE_API + "/block";
    public static final String UNBLOCK_USER = BASE_API + "/unblock";
    public static final String GET_BLOCKED_USERS = BASE_API + "/blocked";
    public static final String GET_USERS_WHO_BLOCKED_ME = BASE_API + "/blocked-by";
    public static final String CHECK_BLOCK_STATUS = BASE_API + "/status";
    public static final String GET_ALL_BLOCKS_ADMIN = BASE_API + "/admin/all";
    public static final String REMOVE_BLOCK_ADMIN = BASE_API + "/admin/remove";
}
