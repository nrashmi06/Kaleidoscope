package com.kaleidoscope.backend.auth.service;

import com.kaleidoscope.backend.auth.dto.request.UserRegistrationRequestDTO;
import com.kaleidoscope.backend.auth.dto.response.UserRegistrationResponseDTO;

/**
 * Service for handling user registration process
 */
public interface UserRegistrationService {

    /**
     * Register a new user with all necessary setup
     *
     * @param registrationRequest User registration data
     * @return Registration response with user details
     */
    UserRegistrationResponseDTO registerUser(UserRegistrationRequestDTO registrationRequest);
}
