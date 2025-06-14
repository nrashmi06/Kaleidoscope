package com.kaleidoscope.backend.users.routes;

public final class UserRoutes {

    private UserRoutes() {
        throw new IllegalStateException("Utility class");
    }

    private static final String BASE_API = "/api/users";

    public static final String USER_ID_PATH = "/{userId}";
    public static final String GET_ALL_USERS_BY_PROFILE_STATUS = BASE_API;
    public static final String UPDATE_USER_PROFILE_STATUS = BASE_API + "/profile-status";
    public static final String UPDATE_USER_PROFILE = BASE_API + "/profile";
}