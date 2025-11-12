package com.kaleidoscope.backend.auth.service.impl;

import com.kaleidoscope.backend.auth.routes.AuthRoutes;
import com.kaleidoscope.backend.auth.service.EmailService;
import com.kaleidoscope.backend.shared.config.ApplicationProperties;
import com.kaleidoscope.backend.shared.config.ServletProperties;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Map;

@Service
public class EmailServiceImpl implements EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);
    private final JavaMailSender javaMailSender;
    private final TemplateEngine templateEngine;
    private final ApplicationProperties applicationProperties;
    private final ServletProperties servletProperties;

    @Autowired
    public EmailServiceImpl(JavaMailSender javaMailSender,
                            TemplateEngine templateEngine,
                            ApplicationProperties applicationProperties,
                            ServletProperties servletProperties) {
        this.javaMailSender = javaMailSender;
        this.templateEngine = templateEngine;
        this.applicationProperties = applicationProperties;
        this.servletProperties = servletProperties;
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
            sendHtmlEmail(email, subject, body);
            logger.info("Password reset email sent to: {}", email);
        } catch (Exception e) {
            logger.error("Failed to send password reset email to: {}", email, e);
            // Don't rethrow - async method should handle errors gracefully
        }
    }

    private void sendHtmlEmail(String to, String subject, String body) {
        MimeMessage message = javaMailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);
            javaMailSender.send(message);
        } catch (MessagingException e) {
            logger.error("Failed to send email to: {}", to, e);
            throw new MailSendException("Failed to send email", e);
        }
    }

    @Override
    @Async("taskExecutor")
    public void sendVerificationEmail(String email, String code) {
        logger.info("Starting to send verification email to: {}", email);
        try {
            String subject = "Verify your email address";
            String baseUrl = applicationProperties.baseUrl();
            String contextPath = servletProperties.contextPath();
            String verificationUrl = baseUrl + contextPath + AuthRoutes.VERIFY_EMAIL + "?token=" + code;
            Context context = new Context();
            context.setVariable("verificationUrl", verificationUrl);
            String body = templateEngine.process("verificationEmailTemplate", context);
            sendHtmlEmail(email, subject, body);
            logger.info("Verification email sent to: {}", email);
        } catch (Exception e) {
            logger.error("Failed to send verification email to: {}", email, e);
            // Don't rethrow - async method should handle errors gracefully
        }
    }

    @Override
    @Async("taskExecutor")
    public void sendNotificationEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        logger.info("Starting to send notification email to: {}, template: {}", to, templateName);
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

            String body = templateEngine.process(templateName, context);
            sendHtmlEmail(to, subject, body);
            logger.info("Notification email sent successfully to: {}, template: {}", to, templateName);
        } catch (Exception e) {
            logger.error("Failed to send notification email to: {}, template: {}", to, templateName, e);
            // Don't rethrow - async method should handle errors gracefully
        }
    }
}