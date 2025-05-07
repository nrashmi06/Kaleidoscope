package com.kaleidoscope.backend.auth.service.impl;

import com.kaleidoscope.backend.auth.routes.AuthRoutes;
import com.kaleidoscope.backend.shared.config.ServletProperties;
import com.kaleidoscope.backend.users.repository.UserRepository;
import com.kaleidoscope.backend.auth.service.EmailService;
import com.kaleidoscope.backend.shared.config.ApplicationProperties;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class EmailServiceImpl implements EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);
    private final JavaMailSender javaMailSender;
    private final TemplateEngine templateEngine;
    private final UserRepository userRepository;
    private final ApplicationProperties applicationProperties;
    private final ServletProperties servletProperties;

    @Autowired
    public EmailServiceImpl(JavaMailSender javaMailSender,
                            TemplateEngine templateEngine,
                            UserRepository userRepository,
                            ApplicationProperties applicationProperties,
                            ServletProperties servletProperties) {
        this.javaMailSender = javaMailSender;
        this.templateEngine = templateEngine;
        this.userRepository = userRepository;
        this.applicationProperties = applicationProperties;
        this.servletProperties = servletProperties;
    }

    @Override
    public void sendPasswordResetEmail(String email, String code) {
        logger.info("Starting to send password reset email to: {}", email);
        String subject = "Reset your password";
        Context context = new Context();
        context.setVariable("code", code);
        String body = templateEngine.process("passwordResetEmailTemplate", context);
        sendHtmlEmail(email, subject, body);
        logger.info("Password reset email sent to: {}", email);
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
    public void sendVerificationEmail(String email, String code) {
        logger.info("Starting to send verification email to: {}", email);
        String subject = "Verify your email address";
        String baseUrl = applicationProperties.getBaseUrl();
        String contextPath = servletProperties.getContextPath();
        String verificationUrl = baseUrl + contextPath + AuthRoutes.VERIFY_EMAIL + "?token=" + code;
        Context context = new Context();
        context.setVariable("verificationUrl", verificationUrl);
        String body = templateEngine.process("verificationEmailTemplate", context);
        sendHtmlEmail(email, subject, body);
        logger.info("Verification email sent to: {}", email);
    }
}