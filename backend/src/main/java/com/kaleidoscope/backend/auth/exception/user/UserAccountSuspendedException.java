
package com.kaleidoscope.backend.auth.exception.user;

public class UserAccountSuspendedException extends RuntimeException {
    public UserAccountSuspendedException(String message) {
        super(message);
    }
}