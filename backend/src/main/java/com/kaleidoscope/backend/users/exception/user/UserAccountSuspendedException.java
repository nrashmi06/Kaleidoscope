
package com.kaleidoscope.backend.users.exception.user;

public class UserAccountSuspendedException extends RuntimeException {
    public UserAccountSuspendedException(String message) {
        super(message);
    }
}