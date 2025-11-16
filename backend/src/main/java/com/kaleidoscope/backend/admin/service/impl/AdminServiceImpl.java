package com.kaleidoscope.backend.admin.service.impl;

import com.kaleidoscope.backend.admin.service.AdminService;
import com.kaleidoscope.backend.auth.service.EmailService;
import com.kaleidoscope.backend.users.repository.UserRepository;
import com.kaleidoscope.backend.shared.enums.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final EmailService emailService;

    @Override
    @Async("taskExecutor")
    public void sendMassEmail(String subject, String body, List<Role> targetRoles, List<MultipartFile> attachments) {
        log.info("Starting emergency mass email job with subject: {} to roles: {}", subject, targetRoles);
        // MODIFIED: Use the new repository method
        List<String> recipientEmails = userRepository.findActiveEmailsByRoles(targetRoles);

        if (recipientEmails.isEmpty()) {
            log.warn("No active users found for roles {} to send mass email to.", targetRoles);
            return;
        }

        log.info("Found {} active users for roles {}. Begin sending emails...", recipientEmails.size(), targetRoles);

        // This part remains the same
        Map<String, Object> emailVariables = Map.of("subject", subject, "body", body);

        for (int i = 0; i < recipientEmails.size(); i++) {
            String email = recipientEmails.get(i);
            try {
                emailService.sendNotificationEmail(
                    email,
                    subject,
                    "massEmailBroadcast", // Use the template from the previous prompt
                    emailVariables,
                    attachments
                );

                if ((i + 1) % 100 == 0) {
                    log.info("Mass email progress: {}/{} emails dispatched.", i + 1, recipientEmails.size());
                }
            } catch (Exception e) {
                log.error("Failed to dispatch mass email to {}: {}", email, e.getMessage());
            }
        }
        log.info("Mass email job finished dispatching all {} emails.", recipientEmails.size());
    }
}
