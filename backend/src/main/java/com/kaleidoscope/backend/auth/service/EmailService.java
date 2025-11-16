package com.kaleidoscope.backend.auth.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface EmailService {
    void sendPasswordResetEmail(String email, String code);
    void sendVerificationEmail(String email, String code);
    void sendNotificationEmail(String to, String subject, String templateName, Map<String, Object> variables);
    void sendNotificationEmail(String to, String subject, String templateName, Map<String, Object> variables, List<MultipartFile> attachments);
}