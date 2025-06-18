package com.kaleidoscope.backend.shared.routes;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class CategoryRoutes {
    private static final String API_VERSION = "/api";

    // Base routes
    public static final String CATEGORIES = API_VERSION + "/categories";

    // Path variable segments
    public static final String CATEGORY_ID = "/{categoryId}";

    // Full path patterns
    public static final String GET_ALL_PARENT_CATEGORIES = CATEGORIES;
    public static final String GET_CATEGORY_BY_ID = CATEGORIES + CATEGORY_ID;
    public static final String CREATE_CATEGORY = CATEGORIES;
    public static final String UPDATE_CATEGORY = CATEGORIES + CATEGORY_ID;
    public static final String DELETE_CATEGORY = CATEGORIES + CATEGORY_ID;
}