package com.kaleidoscope.backend.users.routes;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class UserPreferencesRoutes {
    public static final String BASE = "/api/user-preferences";
    public static final String GET_PREFERENCES = BASE;
    public static final String UPDATE_PREFERENCES = BASE;
    public static final String UPDATE_THEME = BASE + "/theme";
    public static final String UPDATE_LANGUAGE = BASE + "/language";
    public static final String UPDATE_PRIVACY = BASE + "/privacy";
    public static final String UPDATE_VISIBILITY = BASE + "/visibility";
}
