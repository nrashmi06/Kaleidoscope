package com.kaleidoscope.backend.users.routes;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class UserNotificationPreferencesRoutes {
    public static final String BASE = "/api/user-notification-preferences";
    public static final String GET_NOTIFICATION_PREFERENCES = BASE;
    public static final String GET_ALL_NOTIFICATION_PREFERENCES = BASE + "/admin/all";
    public static final String UPDATE_NOTIFICATION_PREFERENCES = BASE;
    public static final String PARTIAL_UPDATE_NOTIFICATION_PREFERENCES = BASE;
    public static final String RESET_TO_DEFAULTS = BASE + "/reset";
}
