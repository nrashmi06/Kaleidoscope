package com.kaleidoscope.backend.auth.service.impl;

import com.kaleidoscope.backend.auth.dto.request.UserRegistrationRequestDTO;
import com.kaleidoscope.backend.auth.dto.response.UserRegistrationResponseDTO;
import com.kaleidoscope.backend.auth.exception.email.EmailAlreadyInUseException;
import com.kaleidoscope.backend.auth.service.AuthService;
import com.kaleidoscope.backend.shared.enums.AccountStatus;
import com.kaleidoscope.backend.shared.enums.Role;
import com.kaleidoscope.backend.users.exception.user.InvalidUsernameException;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.repository.UserRepository;
import com.kaleidoscope.backend.users.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@ActiveProfiles("test")
@DisplayName("User Registration Service Tests")
class UserRegistrationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserService userService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthServiceImpl authService;

    private UserRegistrationRequestDTO validRegisterRequest;
    private MockMultipartFile profilePicture;
    private User expectedUser;

    @BeforeEach
    void setUp() {
        // Create dummy profile picture
        profilePicture = new MockMultipartFile(
                "profilePicture",
                "test-profile.jpg",
                "image/jpeg",
                "dummy image content".getBytes()
        );

        // Create valid registration request with dummy data
        validRegisterRequest = UserRegistrationRequestDTO.builder()
                .email("john.doe@example.com")
                .password("SecurePass123!")
                .username("johndoe2024")
                .designation("Full Stack Developer")
                .summary("Passionate software developer with 3+ years of experience in building web applications using React, Node.js, and Spring Boot. Love creating innovative solutions and collaborating with teams.")
                .build();

        // Create expected user object
        expectedUser = User.builder()
                .userId(1L)
                .email("john.doe@example.com")
                .username("johndoe2024")
                .password("encodedPassword123")
                .designation("Full Stack Developer")
                .summary("Passionate software developer with 3+ years of experience in building web applications using React, Node.js, and Spring Boot. Love creating innovative solutions and collaborating with teams.")
                .role(Role.USER)
                .accountStatus(AccountStatus.ACTIVE)
                .profilePictureUrl("https://example.com/profile-pictures/johndoe2024.jpg")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should successfully register a new user with valid data")
    void shouldRegisterUserSuccessfully() {
        // Given
        when(userService.existsByEmail(validRegisterRequest.getEmail())).thenReturn(false);
        when(userService.existsByUsername(validRegisterRequest.getUsername())).thenReturn(false);
        when(passwordEncoder.encode(validRegisterRequest.getPassword())).thenReturn("encodedPassword123");
        when(userRepository.save(any(User.class))).thenReturn(expectedUser);

        // When
        UserRegistrationResponseDTO result = authService.registerUser(validRegisterRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("john.doe@example.com");
        assertThat(result.getUsername()).isEqualTo("johndoe2024");
        assertThat(result.getDesignation()).isEqualTo("Full Stack Developer");
        assertThat(result.getUserId()).isNotNull();
        assertThat(result.getRole()).isEqualTo(Role.USER);

        // Verify interactions
        verify(userService).existsByEmail("john.doe@example.com");
        verify(userService).existsByUsername("johndoe2024");
        verify(passwordEncoder).encode("SecurePass123!");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when email already exists")
    void shouldThrowExceptionWhenEmailExists() {
        // Given
        when(userService.existsByEmail(validRegisterRequest.getEmail())).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> authService.registerUser(validRegisterRequest))
                .isInstanceOf(EmailAlreadyInUseException.class);

        verify(userService).existsByEmail("john.doe@example.com");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when username already exists")
    void shouldThrowExceptionWhenUsernameExists() {
        // Given
        when(userService.existsByEmail(validRegisterRequest.getEmail())).thenReturn(false);
        when(userService.existsByUsername(validRegisterRequest.getUsername())).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> authService.registerUser(validRegisterRequest))
                .isInstanceOf(InvalidUsernameException.class);

        verify(userService).existsByEmail("john.doe@example.com");
        verify(userService).existsByUsername("johndoe2024");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should register user successfully and return user data")
    void shouldRegisterUserSuccessfullyAndReturnUserData() {
        // Given
        when(userService.existsByEmail(validRegisterRequest.getEmail())).thenReturn(false);
        when(userService.existsByUsername(validRegisterRequest.getUsername())).thenReturn(false);
        when(passwordEncoder.encode(validRegisterRequest.getPassword())).thenReturn("encodedPassword123");

        User userWithoutPicture = User.builder()
                .userId(1L)
                .email("john.doe@example.com")
                .username("johndoe2024")
                .password("encodedPassword123")
                .designation("Full Stack Developer")
                .summary("Passionate software developer with 3+ years of experience in building web applications using React, Node.js, and Spring Boot. Love creating innovative solutions and collaborating with teams.")
                .role(Role.USER)
                .accountStatus(AccountStatus.ACTIVE)
                .profilePictureUrl(null)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        when(userRepository.save(any(User.class))).thenReturn(userWithoutPicture);

        // When
        UserRegistrationResponseDTO result = authService.registerUser(validRegisterRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getProfilePictureUrl()).isNull();
        assertThat(result.getEmail()).isEqualTo("john.doe@example.com");
        assertThat(result.getUsername()).isEqualTo("johndoe2024");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should handle admin role assignment during registration")
    void shouldHandleAdminRoleAssignment() {
        // Given - Admin registration scenario
        UserRegistrationRequestDTO adminRequest = UserRegistrationRequestDTO.builder()
                .email("admin@kaleidoscope.com")
                .username("adminuser")
                .password("SecurePass123!")
                .designation("Full Stack Developer")
                .summary("Passionate software developer with 3+ years of experience in building web applications using React, Node.js, and Spring Boot. Love creating innovative solutions and collaborating with teams.")
                .build();

        User adminUser = User.builder()
                .userId(2L)
                .email("admin@kaleidoscope.com")
                .username("adminuser")
                .password("encodedPassword123")
                .designation("Full Stack Developer")
                .summary("Passionate software developer with 3+ years of experience in building web applications using React, Node.js, and Spring Boot. Love creating innovative solutions and collaborating with teams.")
                .role(Role.ADMIN)
                .accountStatus(AccountStatus.ACTIVE)
                .profilePictureUrl("https://example.com/profile-pictures/adminuser.jpg")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(userService.existsByEmail(adminRequest.getEmail())).thenReturn(false);
        when(userService.existsByUsername(adminRequest.getUsername())).thenReturn(false);
        when(passwordEncoder.encode(adminRequest.getPassword())).thenReturn("encodedPassword123");
        when(userRepository.save(any(User.class))).thenReturn(adminUser);

        // When
        UserRegistrationResponseDTO result = authService.registerUser(adminRequest);

        // Then
        assertThat(result.getRole()).isEqualTo(Role.ADMIN);
        assertThat(result.getEmail()).isEqualTo("admin@kaleidoscope.com");
        assertThat(result.getUsername()).isEqualTo("adminuser");
    }

    @Test
    @DisplayName("Should validate password encoding during registration")
    void shouldValidatePasswordEncoding() {
        // Given
        String rawPassword = "TestPassword123!";
        String encodedPassword = "$2a$10$encodedPasswordHash";

        UserRegistrationRequestDTO request = UserRegistrationRequestDTO.builder()
                .email("john.doe@example.com")
                .password(rawPassword)
                .username("johndoe2024")
                .designation("Full Stack Developer")
                .summary("Passionate software developer with 3+ years of experience in building web applications using React, Node.js, and Spring Boot. Love creating innovative solutions and collaborating with teams.")
                .build();

        when(userService.existsByEmail(request.getEmail())).thenReturn(false);
        when(userService.existsByUsername(request.getUsername())).thenReturn(false);
        when(passwordEncoder.encode(rawPassword)).thenReturn(encodedPassword);
        when(userRepository.save(any(User.class))).thenReturn(expectedUser);

        // When
        UserRegistrationResponseDTO result = authService.registerUser(request);

        // Then
        assertThat(result).isNotNull();
        verify(passwordEncoder).encode(rawPassword);
        verify(userRepository).save(argThat(user ->
            user.getPassword().equals(encodedPassword) &&
            !user.getPassword().equals(rawPassword)
        ));
    }

    @Test
    @DisplayName("Should set correct default values for new user")
    void shouldSetCorrectDefaultValues() {
        // Given
        when(userService.existsByEmail(validRegisterRequest.getEmail())).thenReturn(false);
        when(userService.existsByUsername(validRegisterRequest.getUsername())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(expectedUser);

        // When
        UserRegistrationResponseDTO result = authService.registerUser(validRegisterRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getRole()).isEqualTo(Role.USER);
        assertThat(result.getUserId()).isNotNull();
        verify(userRepository).save(argThat(user -> {
            assertThat(user.getRole()).isEqualTo(Role.USER);
            assertThat(user.getAccountStatus()).isEqualTo(AccountStatus.ACTIVE);
            assertThat(user.getCreatedAt()).isNotNull();
            assertThat(user.getUpdatedAt()).isNotNull();
            return true;
        }));
    }

    @Test
    @DisplayName("Should handle edge cases with special characters in user data")
    void shouldHandleSpecialCharactersInUserData() {
        // Given - User data with special characters
        UserRegistrationRequestDTO specialCharRequest = UserRegistrationRequestDTO.builder()
                .email("test.user+1@example-domain.com")
                .password("P@ssw0rd!#$%")
                .username("user_name-123")
                .designation("Senior Software Engineer & Team Lead")
                .summary("Experienced developer with expertise in Java/Spring, React.js & Node.js. Passionate about clean code & agile methodologies.")
                .build();

        when(userService.existsByEmail(specialCharRequest.getEmail())).thenReturn(false);
        when(userService.existsByUsername(specialCharRequest.getUsername())).thenReturn(false);
        when(passwordEncoder.encode(specialCharRequest.getPassword())).thenReturn("encodedSpecialPassword");
        when(userRepository.save(any(User.class))).thenReturn(expectedUser);

        // When & Then
        assertThatCode(() -> authService.registerUser(specialCharRequest))
                .doesNotThrowAnyException();

        verify(userRepository).save(any(User.class));
    }
}
