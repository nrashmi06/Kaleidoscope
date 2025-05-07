package com.kaleidoscope.backend.auth.routes;

public final class UserRoutes {

    // Prevent instantiation
    private UserRoutes() {
        throw new IllegalStateException("Utility class");
    }

    private static final String BASE_API = "/api/users";

    // Common path variables
    public static final String USER_ID_PATH = "/{userId}";

    // Authentication
    public static final String REGISTER = BASE_API + "/register";           // Register a new user
    public static final String LOGIN = BASE_API + "/login";                 // User login
    public static final String LOGOUT = BASE_API + "/logout";               // User logout
    public static final String RENEW_TOKEN = BASE_API + "/renew-token";     // Refresh JWT token
    public static final String VERIFY_EMAIL = BASE_API + "/verify-email"; // Verify user email
    public static final String RESEND_VERIFICATION_EMAIL = BASE_API + "/resend-verification-email";

    // Password management
    public static final String FORGOT_PASSWORD = BASE_API + "/forgot-password"; // Trigger reset link (via email)
    public static final String RESET_PASSWORD = BASE_API + "/reset-password";   // Reset password using token
    public static final String CHANGE_PASSWORD = BASE_API + "/change-password"; // Authenticated password change

    // User profile & admin endpoints
    public static final String GET_ALL_USERS_BY_PROFILE_STATUS = BASE_API + "/all";        // Fetch all users by status
    public static final String UPDATE_USER_PROFILE_STATUS = BASE_API + "/profile-status";  // Update status
}