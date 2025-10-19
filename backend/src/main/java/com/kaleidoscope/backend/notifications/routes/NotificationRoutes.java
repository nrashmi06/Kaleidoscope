package com.kaleidoscope.backend.notifications.routes;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class NotificationRoutes {

    private static final String BASE_API = "/api/notifications";

    public static final String STREAM = BASE_API + "/stream";
    public static final String GET_NOTIFICATIONS = BASE_API;
    public static final String MARK_AS_READ = BASE_API + "/{notificationId}/read";
    public static final String MARK_ALL_AS_READ = BASE_API + "/read-all";
    public static final String DELETE_NOTIFICATION = BASE_API + "/{notificationId}";
}
