package com.kaleidoscope.backend.users.exception.follow;

public class FollowRelationshipNotFoundException extends RuntimeException {
    public FollowRelationshipNotFoundException(String message) {
        super(message);
    }
}
