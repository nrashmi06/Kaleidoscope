package com.kaleidoscope.backend.users.mapper;

import com.kaleidoscope.backend.shared.enums.AccountStatus;
import com.kaleidoscope.backend.shared.enums.Role;
import com.kaleidoscope.backend.auth.dto.request.UserRegistrationRequestDTO;
import com.kaleidoscope.backend.users.dto.request.UpdateUserProfileRequestDTO;
import com.kaleidoscope.backend.users.dto.response.UpdateUserProfileResponseDTO;
import com.kaleidoscope.backend.users.dto.response.UserDetailsSummaryResponseDTO;
import com.kaleidoscope.backend.auth.dto.response.UserLoginResponseDTO;
import com.kaleidoscope.backend.auth.dto.response.UserRegistrationResponseDTO;
import com.kaleidoscope.backend.users.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserMapper {

    public User toUser(UserRegistrationRequestDTO userRegistrationRequestDTO) {
        return User.builder()
                .email(userRegistrationRequestDTO.getEmail())
                .password(userRegistrationRequestDTO.getPassword())
                .username(userRegistrationRequestDTO.getUsername())
                .build();
    }

    public static UserLoginResponseDTO toUserLoginResponseDTO(User user) {
        return UserLoginResponseDTO.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .username(user.getUsername())
                .role(user.getRole().name())
                .build();
    }

    public User toEntity(UserRegistrationRequestDTO dto, String encodedPassword, String profilePictureUrl) {
        return User.builder()
                .username(dto.getUsername())
                .password(encodedPassword)
                .role(Role.USER)
                .accountStatus(AccountStatus.DEACTIVATED)
                .email(dto.getEmail())
                .designation(dto.getDesignation())
                .summary(dto.getSummary())
                .profilePictureUrl(profilePictureUrl)
                .build();
    }

    public static UserDetailsSummaryResponseDTO toUserDetailsSummaryResponseDTO(User user) {
        return UserDetailsSummaryResponseDTO.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .username(user.getUsername())
                .accountStatus(user.getAccountStatus().name())
                .profilePictureUrl(user.getProfilePictureUrl()) // <-- ADD THIS LINE
                .build();
    }

    public static UserRegistrationResponseDTO toRegistrationResponseDTO(User user) {
        return UserRegistrationResponseDTO.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .username(user.getUsername())
                .role(user.getRole())
                .designation(user.getDesignation())
                .summary(user.getSummary())
                .coverPhotoUrl(user.getCoverPhotoUrl())
                .profilePictureUrl(user.getProfilePictureUrl())
                .build();
    }
    public static User updateUserFromDTO(User user, UpdateUserProfileRequestDTO dto) {
        if (dto.getUsername() != null && !dto.getUsername().isEmpty()) {
            user.setUsername(dto.getUsername());
        }
        if (dto.getDesignation() != null) {
            user.setDesignation(dto.getDesignation());
        }
        if (dto.getSummary() != null) {
            user.setSummary(dto.getSummary());
        }
        return user;
    }

    public static UpdateUserProfileResponseDTO toUpdateUserProfileResponseDTO(User user) {
        return UpdateUserProfileResponseDTO.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .username(user.getUsername())
                .designation(user.getDesignation())
                .summary(user.getSummary())
                .profilePictureUrl(user.getProfilePictureUrl())
                .coverPhotoUrl(user.getCoverPhotoUrl())
                .build();
    }
}