package com.kaleidoscope.backend.auth.repository;

import com.kaleidoscope.backend.auth.model.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Integer> {
    Optional<EmailVerification> findByVerificationCode(String verificationCode);
    Optional<EmailVerification> findByEmail(String email);
}