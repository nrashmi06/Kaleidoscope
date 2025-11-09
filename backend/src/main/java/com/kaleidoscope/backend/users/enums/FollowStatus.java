package com.kaleidoscope.backend.users.enums;

public enum FollowStatus {
    /**
     * The viewing user is not following the profile user.
     */
    NONE,
    /**
     * The viewing user is already following the profile user.
     */
    FOLLOWING,
    /**
     * The viewing user has sent a follow request to the (private) profile user.
     */
    REQUESTED
}

