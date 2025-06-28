package com.kaleidoscope.backend.users.routes;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class UserNotificationPreferencesRoutes {
    public static final String BASE = "/api/user-notification-preferences";
    public static final String GET_NOTIFICATION_PREFERENCES = BASE;
    public static final String UPDATE_NOTIFICATION_PREFERENCES = BASE;
    public static final String UPDATE_LIKES_PREFERENCES = BASE + "/likes";
    public static final String UPDATE_COMMENTS_PREFERENCES = BASE + "/comments";
    public static final String UPDATE_FOLLOWS_PREFERENCES = BASE + "/follows";
    public static final String UPDATE_MENTIONS_PREFERENCES = BASE + "/mentions";
    public static final String UPDATE_SYSTEM_PREFERENCES = BASE + "/system";
    public static final String UPDATE_EMAIL_PREFERENCES = BASE + "/email";
    public static final String UPDATE_PUSH_PREFERENCES = BASE + "/push";
    public static final String ENABLE_ALL_EMAIL = BASE + "/email/enable-all";
    public static final String DISABLE_ALL_EMAIL = BASE + "/email/disable-all";
    public static final String ENABLE_ALL_PUSH = BASE + "/push/enable-all";
    public static final String DISABLE_ALL_PUSH = BASE + "/push/disable-all";
    public static final String RESET_TO_DEFAULTS = BASE + "/reset";
}
