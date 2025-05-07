package com.kaleidoscope.backend.auth.service;

public interface EmailService {
    void sendPasswordResetEmail(String email, String code);
}