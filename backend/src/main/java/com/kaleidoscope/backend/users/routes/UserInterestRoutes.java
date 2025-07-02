package com.kaleidoscope.backend.users.routes;

public final class UserInterestRoutes {

    private UserInterestRoutes() {
        throw new IllegalStateException("Utility class");
    }

    private static final String BASE_API = "/api/users/interests";

    public static final String ADD_USER_INTEREST = BASE_API;
    public static final String ADD_USER_INTERESTS_BULK = BASE_API + "/bulk";
    public static final String REMOVE_USER_INTEREST = BASE_API + "/{categoryId}";
    public static final String REMOVE_USER_INTERESTS_BULK = BASE_API + "/bulk";
    public static final String GET_USER_INTERESTS = BASE_API;
    public static final String GET_USER_INTERESTS_BY_USER_ID = BASE_API + "/user/{userId}";
    public static final String ADMIN_GET_CATEGORY_ANALYTICS = BASE_API + "/admin/category-analytics";
}
