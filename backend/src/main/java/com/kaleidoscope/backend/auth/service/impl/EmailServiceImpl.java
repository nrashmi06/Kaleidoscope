package com.kaleidoscope.backend.auth.service.impl;

import com.kaleidoscope.backend.auth.config.ResendProperties;
import com.kaleidoscope.backend.auth.routes.AuthRoutes;
import com.kaleidoscope.backend.auth.service.EmailService;
import com.kaleidoscope.backend.shared.config.ApplicationProperties;
import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.Attachment;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class EmailServiceImpl implements EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final String fromEmail;
    private final Resend resend;
    private final TemplateEngine templateEngine;
    private final ApplicationProperties applicationProperties;

    @Autowired
    public EmailServiceImpl(ResendProperties resendProperties,
                            TemplateEngine templateEngine,
                            ApplicationProperties applicationProperties) {
        this.resend = new Resend(resendProperties.apiKey());
        this.fromEmail = resendProperties.fromEmail();
        this.templateEngine = templateEngine;
        this.applicationProperties = applicationProperties;
    }

    @Override
    @Async("taskExecutor")
    public void sendPasswordResetEmail(String email, String code) {
        logger.info("Starting to send password reset email to: {}", email);
        try {
            String subject = "Reset your password";
            Context context = new Context();
            context.setVariable("code", code);
            String body = templateEngine.process("passwordResetEmailTemplate", context);
            sendHtmlEmail(email, subject, body, Collections.emptyList());
            logger.info("Password reset email sent to: {}", email);
        } catch (Exception e) {
            logger.error("Failed to send password reset email to: {}", email, e);
            // Don't rethrow - async method should handle errors gracefully
        }
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody, List<MultipartFile> attachments) {
        try {
            List<Attachment> resendAttachments = new ArrayList<>();
            if (attachments != null && !attachments.isEmpty()) {
                for (MultipartFile file : attachments) {
                    try {
                        byte[] fileBytes = file.getBytes();
                        String base64Content = Base64.getEncoder().encodeToString(fileBytes);

                        Attachment resendAttachment = Attachment.builder()
                                .content(base64Content)
                                .path(file.getOriginalFilename())
                                .build();
                        resendAttachments.add(resendAttachment);

                    } catch (IOException e) {
                        logger.error("Failed to process attachment {}: {}", file.getOriginalFilename(), e.getMessage());
                        // Skip the bad attachment and continue
                    }
                }
            }

            CreateEmailOptions emailOptions = CreateEmailOptions.builder()
                    .from(fromEmail)
                    .to(to)
                    .subject(subject)
                    .html(htmlBody)
                    .attachments(resendAttachments)
                    .build();

            CreateEmailResponse response = resend.emails().send(emailOptions);
            logger.info("Email sent successfully to: {} with ID: {}", to, response.getId());
        } catch (ResendException e) {
            logger.error("Failed to send email to: {} - Error: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    @Override
    @Async("taskExecutor")
    public void sendVerificationEmail(String email, String code) {
        logger.info("Starting to send verification email to: {}", email);
        try {
            String subject = "Verify your email address";
            String baseUrl = applicationProperties.baseUrl();
            String verificationUrl = baseUrl + AuthRoutes.VERIFY_EMAIL + "?token=" + code;
            Context context = new Context();
            context.setVariable("verificationUrl", verificationUrl);
            String body = templateEngine.process("verificationEmailTemplate", context);
            sendHtmlEmail(email, subject, body, Collections.emptyList());
            logger.info("Verification email sent to: {}", email);
        } catch (Exception e) {
            logger.error("Failed to send verification email to: {}", email, e);
            // Don't rethrow - async method should handle errors gracefully
        }
    }

    @Override
    @Async("taskExecutor")
    public void sendNotificationEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        // Call the new method with no attachments
        sendNotificationEmail(to, subject, templateName, variables, Collections.emptyList());
    }

    @Override
    @Async("taskExecutor")
    public void sendNotificationEmail(String to, String subject, String templateName, Map<String, Object> variables, List<MultipartFile> attachments) {
        logger.info("Starting to send notification email to: {}, template: {}, attachments: {}", to, templateName, attachments != null ? attachments.size() : 0);
        try {
            Context context = new Context();

            // Add all variables to context
            if (variables != null) {
                variables.forEach(context::setVariable);
            }

            // Add baseUrl if not already present
            if (!context.containsVariable("baseUrl")) {
                context.setVariable("baseUrl", applicationProperties.baseUrl());
            }

            // Add subject to context for the new template
            context.setVariable("subject", subject);

            // For the mass email, the body is passed in variables, not the subject.
            // This is fine as the template just needs the variables.
            if (variables.containsKey("body") && !context.containsVariable("body")) {
                context.setVariable("body", variables.get("body"));
            }

            String body = templateEngine.process(templateName, context);
            sendHtmlEmail(to, subject, body, attachments); // Pass attachments down
            logger.info("Notification email dispatched successfully to: {}, template: {}", to, templateName);
        } catch (Exception e) {
            logger.error("Failed to send notification email to: {}, template: {}", to, templateName, e);
            // Don't rethrow - async method should handle errors gracefully
        }
    }
}