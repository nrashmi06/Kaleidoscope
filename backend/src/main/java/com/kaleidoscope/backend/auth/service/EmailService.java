package com.kaleidoscope.backend.auth.service;

import java.util.Map;

public interface EmailService {
    void sendPasswordResetEmail(String email, String code);
    void sendVerificationEmail(String email, String code);
    void sendNotificationEmail(String to, String subject, String templateName, Map<String, Object> variables);
}