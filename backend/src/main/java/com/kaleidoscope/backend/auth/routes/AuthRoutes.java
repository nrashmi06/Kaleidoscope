package com.kaleidoscope.backend.auth.routes;

public final class AuthRoutes {

    private AuthRoutes() {
        throw new IllegalStateException("Utility class");
    }

    private static final String BASE_API = "/api/auth";

    public static final String REGISTER = BASE_API + "/register";
    public static final String LOGIN = BASE_API + "/login";
    public static final String LOGOUT = BASE_API + "/logout";
    public static final String RENEW_TOKEN = BASE_API + "/renew-token";
    public static final String VERIFY_EMAIL = BASE_API + "/verify-email";
    public static final String RESEND_VERIFICATION_EMAIL = BASE_API + "/resend-verification-email";

    public static final String FORGOT_PASSWORD = BASE_API + "/forgot-password";
    public static final String RESET_PASSWORD = BASE_API + "/reset-password";
    public static final String CHANGE_PASSWORD = BASE_API + "/change-password";
}
